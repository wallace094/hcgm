import * as React from "react";
import type { TransactionType } from "~/lib/types";

interface EmailTemplateProps {
  sales: TransactionType;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  sales,
}) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      lineHeight: "1.6",
      color: "#333",
      padding: "20px",
      border: "1px solid #eee",
      borderRadius: "8px",
      maxWidth: "600px",
      margin: "0 auto",
    }}
  >
    <h2 style={{ color: "#4CAF50" }}>Transaction Status Update</h2>

    {/* <p>Dear Customer,</p> */}

    <p>
      We wanted to let you know that the status of your transaction{" "}
      <strong>#{sales.DOC_NUM || sales.ID}</strong> has been updated.
    </p>

    <p>
      <strong>New Status:</strong>{" "}
      <span style={{ color: "#4CAF50", fontWeight: "bold" }}>
        {sales.STATUS}
      </span>
    </p>

    <p>
      <strong>Transaction Date:</strong>{" "}
      {new Date(sales.TRANSACTION_DATE).toLocaleString()}
      <br />
      <strong>Total Price:</strong> RM{sales.TOTAL_PRICE.toFixed(2)}
      <br />
      <strong>Location:</strong> {sales.LOCATION}
    </p>

    {sales.DELIVERY_DATE && (
      <p>
        <strong>Estimated Delivery Date:</strong>{" "}
        {new Date(sales.DELIVERY_DATE).toLocaleDateString()}
      </p>
    )}

    <p>
      If you have any questions regarding your transaction or this update,
      please reply to this email. We’re happy to assist!
    </p>

    <p>
      Best regards,
      <br />
      <em>The Sales Team</em>
    </p>
  </div>
);
