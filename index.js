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
    req.auth = auth
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

  const formattedPhone = `254${cleanedNumber.slice(-9)}`; // format to use 254 followed by the last 9 digits

  const timestamp = getTimestamp()

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
        TransactionType: "CustomerPayBillOnline", //CustomerBuyGoodsOnline - for till
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE, //till number for tills
        PhoneNumber: formattedPhone,
        CallBackURL: "https://mydomain.com/callback-url-path",
        AccountReference: phoneNumber,
        TransactionDesc: "anything here",
      },
      {
        headers: {
          Authorization: `Bearer ${req.mpesaToken}`,
        },
      }
    );
    return res.status(200).json({message: `stk sent successfully to phone number ${formattedPhone}`, data: response.data})
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// stkquery
app.post("/stkquery", async (req, res) => {
  try {
    const timestamp = getTimestamp()
    const password = Buffer.from(
      process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
    ).toString("base64");
    const reqId = req.body.reqId
    
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: reqId,
      },
      {
        headers: {
          Authorization: `Bearer ${req.mpesaToken}`,
        },
      }
    );
    return { data: response.data };
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
})

// b2c

const getTimestamp = () => {
  const date = new Date();
  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);
    return timestamp
}

app.listen(port, () => `Server is running on port ${port}`);
