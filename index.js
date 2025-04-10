const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT;
const mpesaEnv = process.env.MPESA_ENVIRONMENT;

const MPESA_BASE_URL =
  mpesaEnv === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

app.get("/", (req, res) => {
  res.send(`<h1>App is running on port ${port}</h1>`);
});

// request for authorization
app.use(async (req, res, next) => {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const resp = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          authorization: `Basic ${auth}`,
        },
      }
    );

    req.mpesaToken = resp.data.access_token;
    next();
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// stkpush

app.post("/stk", async (req, res) => {
  // token must be there

  const { phoneNumber, amount } = req.body;
  // validation

  // initiate an stk push
  const cleanedNumber = phoneNumber.replace(/\D/g, "");

  const formattedPhone = `254${cleanedNumber.slice(-9)}`;

  const date = new Date();
  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  const password = Buffer.from(
    process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
  ).toString("base64");
  try {
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: "",
        AccountReference: phoneNumber,
        TransactionDesc: "anything here",
      },
      {
        headers: {
            Authorization: `Bearer ${req.mpesaToken}`
        }
      }
    );
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// stkquery

// b2c

app.listen(port, () => `Server is running on port ${port}`);
