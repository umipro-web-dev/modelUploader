import express from "express"
import * as fs from "fs"
import {execSync} from "child_process"
import {fileTypeFromBuffer} from 'file-type';
const app = express()

interface reqType {
    eachNumber: number,
    encodedFile: string
}

app.post("/upload", async (req, res)=>{
    if (req.header["content-type"] !== "application/json") {
        res.status(415).json({
            error: "invalid content type"
        })
        return
    }

    const body = req.body as reqType

    const rawFile = Buffer.from(body.encodedFile, "base64")

    if ((await fileTypeFromBuffer(rawFile))?.ext !== "zip") {
        res.status(415).json({
            error: "invalid content type"
        })
        return
    }

    const zipFilePath = `./repo/objects/${`./repo/objects/${body.eachNumber.toString()}.zip`}.zip`
    const objectsPath = `./repo/objects/`

    execSync("cd repo && git pull origin main")

    fs.writeFileSync(zipFilePath, rawFile)

    execSync(`npx extract-zip ${zipFilePath} ${objectsPath}`)
    execSync(`rm ${zipFilePath}`)

    if (!fs.existsSync(`./repo/objects/${body.eachNumber.toString()}/tinker.obj`)) {
        execSync("cd repo && git pull origin main")
        res.status(415).json({
            msg: "invalid content type"
        })
        return
    }

    if (!fs.existsSync(`./repo/objects/${body.eachNumber.toString()}/obj.mtl`)) {
        execSync("cd repo && git pull origin main")
        res.status(415).json({
            msg: "invalid content type"
        })
        return
    }
    execSync("cd repo && git add .")
    execSync(`cd repo && git commit -m "upload by user: ${body.eachNumber.toString()}"`)
    execSync("cd repo && git push origin main")
    res.status(200).json({
        msg: "finished nomally"
    })

})

app.listen(10000, ()=> console.log("server is running"))
