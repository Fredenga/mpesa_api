const express = require("express")
const dotenv = require("dotenv")
const axios = require("axios")
const app = express()
dotenv.config()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

const port = process.env.PORT
const mpesaEnv = process.env.MPESA_ENVIRONMENT

app.get("/", (req, res) => {
    res.send(`<h1>App is running on port ${port}</h1>`)
})

// request for authorization
app.use(async (req, res, next) => {
    const MPESA_BASE_URL = mpesaEnv === "live" 
    ? "https://api.safaricom.co.ke" 
    : "https://sandbox.safaricom.co.ke"
    try {
        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString("base64")

        const resp = await axios.get(
            `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
            {
                headers: {
                    authorization: `Basic ${auth}`
                }
            }
        )

        req.mpesaToken = resp.data.access_token
        next()
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

// stkpush

app.post("/stk", (req, res) => {
    // token must be there
    res.json(req.mpesaToken)

    const {phoneNumber, amount} = req.body
    // validation

    // initiate an stk push
})

// stkquery

// b2c

app.listen(port, () => `Server is running on port ${port}`)