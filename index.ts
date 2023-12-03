import express, { raw } from "express"
import * as fs from "fs"
import {execSync} from "child_process"
import {fileTypeFromBuffer} from 'file-type';
import { fileURLToPath } from 'url';
import decompress from "decompress"
import path from "path"
const app = express()

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

interface reqType {
    eachNumber: number,
    encodedFile: string
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

    const body = req.body as reqType

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

    const objectsPath = path.join(__dirname,`/ar/objects/${body.eachNumber.toString()}`)

    execSync("cd ar && git checkout main")

    try {
        execSync('cd ar && git pull origin main', shellType)
    } catch(e) {
        res.status(500).json({
            errCode: 5,
            msg: "internal server error: token expired. please contact admin."
        })
        return
    }

    

    const modelFiles = await decompress(rawFile, undefined, {
        filter: file => path.basename(file.path) === "obj.mtl" || path.basename(file.path) === "tinker.obj"
    })

    if (!fs.existsSync(objectsPath)) execSync(`mkdir ${objectsPath}`)

    modelFiles.forEach(file => fs.writeFileSync(path.join(objectsPath,path.basename(file.path)), file.data))

    if (!fs.existsSync(`./ar/objects/${body.eachNumber.toString()}/tinker.obj`)) {
        execSync('cd ar && git pull origin main', shellType)
        res.status(415).json({
            errCode: 3,
            msg: "invalid content type: zip file should be include tinker.obj"
        })
        return
    }

    if (!fs.existsSync(`./ar/objects/${body.eachNumber.toString()}/obj.mtl`)) {
        execSync('cd ar && git pull origin main', shellType)
        res.status(415).json({
            errCode: 4,
            msg: "invalid content type: zip file should be include obj.mtl"
        })
        return
    }

    execSync("cd ar && git add .", shellType)
    try {
    
    execSync(`cd ar && git commit -m "upload by user: ${body.eachNumber.toString()}"`, shellType)

    } catch(e){}

    try {

    execSync('cd ar && git push origin HEAD', shellType)

    } catch(e) {
        res.status(500).json({
            errCode: 5,
            msg: "internal server error: token expired. please contact admin."
        })
        return
    }
    res.status(200).json({
        errCode: null,
        msg: "successed"
    })
})


app.listen(10000, ()=> console.log("server is running"))
