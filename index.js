const express = require("express")
const dotenv = require("dotenv")
const app = express()
dotenv.config()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

const port = process.env.PORT

app.get("/", (req, res) => {
    res.send(`<h1>App is running on port ${port}</h1>`)
})

// request for authorization
app.use(async (req, res, next) => {
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

        const token = resp.data.access_token

    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

// stkpush

app.post("/stk", (req, res) => {
    // token must be there
})

// stkquery

// b2c

app.listen(port, () => `Server is running on port ${port}`)