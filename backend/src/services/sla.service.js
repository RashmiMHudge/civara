import cron from "node-cron";
import Complaint from "../models/Complaint.js";
import axios from "axios";

const getN8nWebhookBaseUrl = () =>
  (process.env.N8N_WEBHOOK_BASE_URL || "http://localhost:5678/webhook").replace(/\/$/, "");

const webhookUrl = (name) => `${getN8nWebhookBaseUrl()}/${name}`;

const pushTimelineEventOnce = (complaint, event, actor, meta = {}) => {
  const lastEvent = complaint.timeline?.[complaint.timeline.length - 1];
  const lastMeta = JSON.stringify(lastEvent?.meta || {});
  const nextMeta = JSON.stringify(meta || {});

  if (
    lastEvent &&
    lastEvent.event === event &&
    lastEvent.actor === actor &&
    lastMeta === nextMeta
  ) {
    return;
  }

  complaint.timeline.push({
    event,
    actor,
    meta,
    time: new Date()
  });
};

export const startSLAMonitor = () => {
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log(" Running SLA Monitor...");

    try {
      const complaints = await Complaint.find({
        status: { $nin: ["RESOLVED", "REJECTED","CLOSED"] },
        "sla.paused": { $ne: true },
        "sla.breached": false
      });

      for (const complaint of complaints) {
        if (!complaint.sla.deadline) continue;

        const now = Date.now();
        const deadline = new Date(complaint.sla.deadline).getTime();

        if (now > deadline) {
          const previousPriority = complaint.priority;

          /* =============================
             SLA BREACH DETECTED
          ============================== */
          complaint.sla.breached = true;

          /* =============================
             AUTO ESCALATION
          ============================== */
          complaint.priority = "EMERGENCY";
          complaint.automation.adminAlertSent = true;
          complaint.automation.adminAlertReason = "SLA_BREACHED";
          complaint.automation.adminAlertedAt = new Date();

          pushTimelineEventOnce(complaint, "SLA_BREACHED", "SYSTEM", {
            deadline: complaint.sla.deadline,
            previousPriority
          });

          pushTimelineEventOnce(complaint, "AUTO_ESCALATED", "SYSTEM", {
            priority: complaint.priority,
            reason: "SLA_BREACHED"
          });

          pushTimelineEventOnce(complaint, "ADMIN_ALERT_SENT", "SYSTEM", {
            reason: "SLA_BREACHED"
          });

          await complaint.save();

          console.log(
            ` SLA Breached & Escalated: ${complaint.complaintCode}`
          );

          /* =============================
             AUTOMATION TRIGGER (n8n)
          ============================== */
          try {
            await axios.post(webhookUrl("sla-breached"), {
              complaintId: complaint._id,
              complaintCode: complaint.complaintCode,
              priority: complaint.priority,
              residentPhone: complaint.resident?.phone || "",
              category: complaint.category || "",
              status: complaint.status
            });
          } catch (err) {
            console.log(" n8n SLA webhook not running");
          }
        }
      }
    } catch (error) {
      console.error("SLA Monitor Error:", error);
    }
  });
};
