import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRScannerModal = ({ onScan, onClose }) => {
  const qrCodeRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const qrCode = new Html5Qrcode("qr-reader");
    qrCodeRef.current = qrCode;

    qrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (startedRef.current) {
            startedRef.current = false;
            qrCode
              .stop()
              .then(() => onScan(decodedText.trim()))
              .catch(() => {});
          }
        }
      )
      .then(() => {
        startedRef.current = true;
      })
      .catch((err) => {
        console.error("QR start failed:", err);
        alert("Camera access required to scan QR code");
      });

    return () => {
      if (startedRef.current) {
        qrCodeRef.current
          ?.stop()
          .catch(() => {});
        startedRef.current = false;
      }
    };
  }, [onScan]);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Scan Visitor QR</h3>

        <div id="qr-reader" style={{ width: "100%" }} />

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
