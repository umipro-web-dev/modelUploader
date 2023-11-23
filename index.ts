import express from "express"
import * as fs from "fs"
import {execSync} from "child_process"
import {fileTypeFromBuffer} from 'file-type';
import { fileURLToPath } from 'url';
import path from "path"
const app = express()

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

interface reqType {
    eachNumber: number,
    encodedFile: string
}
app.use(express.json())
app.post("/upload", async (req, res)=>{
    if (req.headers["content-type"] !== "application/json") {
        res.status(415).json({
            errCode: 1,
            msg: "invalid content type: request should be json"
        })
        return
    }

    const body = req.body as reqType

    console.log(body)

    const rawFile = Buffer.from(body.encodedFile, "base64")

    if ((await fileTypeFromBuffer(rawFile))?.ext !== "zip") {
        res.status(415).json({
            errCode: 2,
            msg: "invalid content type: file should be zip"
        })
        return
    }

    const shellType = {
        shell: "bash"
    }

    const zipFilePath = __dirname+`/ar/objects/${body.eachNumber.toString()}.zip`
    const objectsPath = __dirname+`/ar/objects/${body.eachNumber.toString()}`

    execSync('cd ar && GIT_SSH_COMMAND="ssh -i ../autoUpload" git pull origin main', shellType)

    fs.writeFileSync(zipFilePath, rawFile)

    execSync(`npx extract-zip ${zipFilePath} ${objectsPath}`, shellType)
    execSync(`rm ${zipFilePath}`, shellType)
    execSync(`find ${objectsPath} -name 'tinker.obj' -or -name 'obj.mtl' | xargs -I% mv % ${objectsPath}`)
    execSync(`find ${objectsPath} -type d -delete`)

    if (!fs.existsSync(`./ar/objects/${body.eachNumber.toString()}/tinker.obj`)) {
        execSync('cd ar && GIT_SSH_COMMAND="ssh -i ../autoUpload" git pull origin main', shellType)
        res.status(415).json({
            errCode: 3,
            msg: "invalid content type: zip file should be include tinker.obj"
        })
        return
    }

    if (!fs.existsSync(`./ar/objects/${body.eachNumber.toString()}/obj.mtl`)) {
        execSync('cd ar && GIT_SSH_COMMAND="ssh -i ../autoUpload" git pull origin main', shellType)
        res.status(415).json({
            errCode: 4,
            msg: "invalid content type: zip file should be include obj.mtl"
        })
        return
    }
    execSync("cd ar && git add .", shellType)
    execSync(`cd ar && git commit -m "upload by user: ${body.eachNumber.toString()}"`, shellType)
    execSync('cd ar && GIT_SSH_COMMAND="ssh -i ../autoUpload" git push origin main', shellType)
    res.status(200).json({
        errCode: null,
        msg: "successed"
    })

})

app.listen(10000, ()=> console.log("server is running"))
