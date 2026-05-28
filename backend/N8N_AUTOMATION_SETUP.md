# CIVARA Complaint Automation with n8n (Docker Desktop)

This guide sets up n8n locally and connects it to the complaint automation flow.

## 1) Start n8n in Docker Desktop

From workspace root:

```powershell
docker compose -f docker-compose.n8n.yml up -d
```

Check status:

```powershell
docker ps
```

Open n8n:

- http://localhost:5678

## 2) Configure backend environment

In backend `.env`, set:

```env
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook
AUTOMATION_WEBHOOK_SECRET=replace_with_long_random_secret
```

Restart backend after changing env values.

## 3) Required n8n workflows

Create these workflows in n8n:

1. `complaint-created`
- Trigger: Webhook node (POST)
- Path: `complaint-created`
- Input payload expected from backend:
  - `complaintId`
  - `complaintCode`
  - `phone`
  - `name`
  - `flat`
  - `category`
  - `location`
  - `priority`
  - `description`
  - `repeatedIssue`
  - `preferredCallTime`

Suggested flow:
- Validate phone
- Trigger voice call provider (Twilio/Exotel/etc.)
- On call answer: summarize transcript with AI step
- Call CIVARA webhook to update automation state

2. `complaint-no-response`
- Trigger: Webhook node (POST)
- Path: `complaint-no-response`
- Input payload:
  - `complaintId`
  - `complaintCode`
  - `residentPhone`
  - `attempts`

Suggested flow:
- Send WhatsApp template message
- Notify admin channel (email/Slack/WhatsApp)

## 4) Update complaint from n8n (secure callback)

Use HTTP Request node from n8n:

- Method: `PATCH`
- URL: `http://host.docker.internal:5000/api/complaints/automation/webhook/{{$json.complaintId}}`
- Header: `x-automation-secret: <AUTOMATION_WEBHOOK_SECRET>`
- Body (JSON example):

```json
{
  "callStatus": "COMPLETED",
  "callAttempts": 1,
  "callSummary": "Resident available tomorrow after 5 PM. Leakage in kitchen line.",
  "voiceTranscript": "Full or cleaned transcript from the call",
  "voiceRecordingUrl": "https://provider.example/recording.mp3",
  "residentPreferredSlot": "Tomorrow 5 PM - 7 PM",
  "conversationSummary": "Kitchen sink pipe is leaking heavily. Resident is available tomorrow after 5 PM.",
  "availability": "AVAILABLE",
  "nextCallAt": null,
  "whatsappEscalated": false,
  "noResponseEscalated": false
}
```

For a resident who is out of town or not available, send:

```json
{
  "callStatus": "COMPLETED",
  "callAttempts": 1,
  "conversationSummary": "Resident is out of town until Monday and requested service after returning.",
  "residentPreferredSlot": "Monday after 10 AM",
  "availability": "OUT_OF_TOWN",
  "adminAlertSent": true,
  "adminAlertReason": "RESIDENT_OUT_OF_TOWN"
}
```

`availability: "OUT_OF_TOWN"` or `"UNAVAILABLE"` pauses the Civara SLA. Later, send `"AVAILABLE"` to resume the SLA and extend the deadline by the paused duration.

For no pickup after 3 attempts:

```json
{
  "callStatus": "NO_RESPONSE",
  "callAttempts": 3,
  "callSummary": "No answer after three attempts",
  "availability": "UNKNOWN",
  "whatsappEscalated": true,
  "noResponseEscalated": true
}
```

## 5) Test sequence

1. Resident creates complaint in app
2. Backend posts to n8n `complaint-created`
3. n8n runs call workflow and updates complaint via webhook endpoint
4. If three attempts fail, backend triggers `complaint-no-response`
5. n8n sends WhatsApp and admin notification

## 6) Notes for Docker on Windows

- `host.docker.internal` lets containers call your local backend
- Keep backend running on port `5000`
- If port is different, update URL in n8n HTTP Request node
