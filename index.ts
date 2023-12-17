import express from "express"
import * as fs from "fs"
import {execSync} from "child_process"
import {fileTypeFromBuffer} from 'file-type';
import { fileURLToPath } from 'url';
import decompress from "decompress"
import path from "path"
const app = express()

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

interface uploadReqType {
    eachNumber: string,
    encodedFile: string
}

interface msgReqType {
    name: string,
	schoolName: string,
    personalNum: string,
    msgBody: string
}

app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))
app.post("/upload", async (req, res)=>{

    execSync('cd ar && git config user.name "umipro-web-dev"')
    execSync('cd ar && git config user.email "113771739+umipro-web-dev@users.noreply.github.com"')
    
    if (req.headers["content-type"] !== "application/json") {
        res.status(415).json({
            errCode: 1,
            msg: "invalid content type: request should be json"
        })
        return
    }

    const body = req.body as uploadReqType

    console.log(`[ proccessing request: ${body.eachNumber} ]: begin`)
    

    const rawFile = Buffer.from(body.encodedFile, "base64")

    if ((await fileTypeFromBuffer(rawFile))?.ext !== "zip") {
        res.status(415).json({
            errCode: 2,
            msg: "invalid content type: file should be zip"
        })
        console.log(`[ proccessing request: ${body.eachNumber} ]: end`)
        return 
    }

    const shellType = {
        shell: "bash"
    }

    const objectsPath = path.join(__dirname,`/ar/objects/${body.eachNumber.toString()}`)

    execSync("cd ar && git checkout main")

    try {
        execSync('cd ar && git pull origin main', shellType)
    } catch(e) {
        res.status(500).json({
            errCode: 5,
            msg: "internal server error: token expired. please contact admin."
        })
        console.log(`[ proccessing request: ${body.eachNumber} ]: end`)
        return
    }

    

    const modelFiles = await decompress(rawFile, undefined, {
        filter: file => path.basename(file.path) === "obj.mtl" || path.basename(file.path) === "tinker.obj"
    })

    if (!fs.existsSync(objectsPath)) execSync(`mkdir ${objectsPath}`)

    modelFiles.forEach(file => fs.writeFileSync(path.join(objectsPath,path.basename(file.path)), file.data))

    if (!fs.existsSync(`./ar/objects/${body.eachNumber}/tinker.obj`)) {
        execSync('cd ar && git pull origin main', shellType)
        res.status(415).json({
            errCode: 3,
            msg: "invalid content type: zip file should be include tinker.obj"
        })
        console.log(`[ proccessing request: ${body.eachNumber} ]: end`)
        return
    }

    if (!fs.existsSync(`./ar/objects/${body.eachNumber}/obj.mtl`)) {
        execSync('cd ar && git pull origin main', shellType)
        res.status(415).json({
            errCode: 4,
            msg: "invalid content type: zip file should be include obj.mtl"
        })
        console.log(`[ proccessing request: ${body.eachNumber} ]: end`)
        return
    }

    execSync("cd ar && git add .", shellType)
    try {
    
    execSync(`cd ar && git commit -m "upload by user: ${body.eachNumber}"`, shellType)

    } catch(e){}

    try {

    execSync('cd ar && git push origin HEAD', shellType)

    } catch(e) {
        res.status(500).json({
            errCode: 5,
            msg: "internal server error: token expired. please contact admin."
        })
        console.log(`[ proccessing request: ${body.eachNumber} ]: end`)
        return
    }
    res.status(200).json({
        errCode: null,
        msg: "successed"
    })
    console.log(`[ proccessing request: ${body.eachNumber} ]: end`)
})

app.post("/submitMsg", async (req, res) =>{
    const msgJson = req.body as msgReqType

    const expandedMsg = 
    `
    ユーザーからメッセージが送信されました。
    名前：${msgJson.name}
    中学校名：${msgJson.schoolName}
    4桁番号: ${msgJson.personalNum}
    本文：
    ${msgJson.msgBody}
    
    
    ${new Date().toLocaleString("ja")}
    `

    const fetchRes = await fetch("https://notify-api.line.me/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${process.env.LINE_NOTIFY_TOKEN}`
        },
        body: `message=${encodeURIComponent(expandedMsg)}`
      })

    res.status(fetchRes.status).send();

})


app.listen(10000, ()=> console.log("server is running"))
