"use strict";
const numElement = document.getElementById("4num");
const fileElement = document.getElementById("file");
const modalTextElement = document.getElementById("modal-text");
const modalSuccessElement = document.querySelector(".success");
const modalFailElement = document.querySelector(".fail");
const modalLoadingElement = document.querySelector(".loading");
const modalCloseElement = document.getElementById("closeBtn");
const fileNameElement = document.getElementById("fileName");
const msgNameElement = document.getElementById("name");
const msgPersonalNumberElement = document.getElementById("personalNum");
const schoolNameElement = document.getElementById("schoolName");
const msgBodyElement = document.getElementById("msgBodyText");
const bodyElem = document.querySelector("body")
const modeBoxElem = document.querySelector(".toggle-input")


//onload
const files = fileElement === null || fileElement === void 0 ? void 0 : fileElement.files;
    const file = files ? files[0] : null;
    fileNameElement.textContent = file ? "選択済み： "+file.name : "ファイルが選択されていません";

fileElement.addEventListener("change", () => {
    const files = fileElement === null || fileElement === void 0 ? void 0 : fileElement.files;
    const file = files ? files[0] : null;
    fileNameElement.textContent = file ? "選択済み： "+file.name : "ファイルが選択されていません";
});

window.onload = () => {
    const isDarkMode = matchMedia("(prefers-color-scheme: dark)").matches

    if (true) {
        bodyElem.setAttribute("id", "dark")
        modeBoxElem.checked = true
    } else {
        bodyElem.setAttribute("id", "light")
    }
}

modeBoxElem.addEventListener("input", ()=>{
    if (modeBoxElem.checked) {
        bodyElem.setAttribute("id", "dark")
    } else {
        bodyElem.setAttribute("id", "light")
    }
})

const handleError = (errCode) => {
    modalLoadingElement.classList.add("noShown");
    modalFailElement.classList.remove("noShown");
    switch (errCode) {
        case 1:
            //このサイトでは起きえないエラー。
            modalTextElement.textContent = `サーバーエラー：サーバーでエラーが発生しました。管理者に連絡してください。(500)`;
            break;
        case 2:
            modalTextElement.textContent = `ファイル形式エラー：ファイルがzip形式ではありません。(${errCode})`;
            break;
        case 3:
            modalTextElement.textContent = `ファイル形式エラー：zipファイルにtinker.objが含まれていないか、直下以外の場所にあります。(${errCode})`;
            break;
        case 4:
            modalTextElement.textContent = `ファイル形式エラー：zipファイルにobj.mtlが含まれていないか、直下以外の場所にあります。(${errCode})`;
            break;
        case 5:
            modalTextElement.textContent = `サーバーエラー：サーバーでエラーが発生しました。管理者に連絡してください。(${errCode})`;
            break;
		case 11:
			modalTextElement.textContent = `ファイル形式エラー：ファイルが選択されていません。(${errCode})`;
			break;
		case 12:
			modalTextElement.textContent = `ファイル形式エラー：ファイルに不明なエラーがあります。(${errCode})`;
			break;
        default:
            modalTextElement.textContent = "サーバーエラー：サーバーでエラーが発生しました。管理者に連絡してください。(500)";
            break;
    }
};
const handleSuccess = () => {
    modalLoadingElement.classList.add("noShown");
    modalSuccessElement.classList.remove("noShown");
    modalTextElement.textContent = "アップロードが正常に完了しました。";
};
const modalInit = () => {
    modalLoadingElement.classList.remove("noShown");
    modalSuccessElement.classList.add("noShown");
    modalFailElement.classList.add("noShown");
    modalCloseElement.classList.add("noShown");
	modalTextElement.textContent = "ファイルのアップロードには3〜4秒ほどかかります。";
};
const uploadFile = async () => {
    modalInit();
    const fourNum = numElement === null || numElement === void 0 ? void 0 : numElement.value;
    const files = fileElement === null || fileElement === void 0 ? void 0 : fileElement.files;
    if (fourNum === null || files === null) {
        return;
    }
    const file = files[0];
	if (!file) {
		handleError(11)
		modalCloseElement.classList.remove("noShown")
		return;
	}
    const convertToB64 = (filee) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            const { result } = reader;
            if (typeof result !== "string")
                throw TypeError("Reader did not return string.");
            resolve(result);
        });
        reader.addEventListener("error", () => {
            reject(reader.error);
        });
        reader.readAsDataURL(filee);
    });
    const fileOfBase64 = (await convertToB64(file)).split(",")[1];
    const res = await fetch("./upload", {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            eachNumber: fourNum,
            encodedFile: fileOfBase64
        })
    });
	try {
    const errcode = (await res.json()).errCode;

	if (res.ok && errcode === null) {
        handleSuccess();
    }
    else if (errcode !== null) {
        handleError(errcode);
    }
    modalCloseElement.classList.remove("noShown");

	} catch(e) {
		if (res.status.toString()[0] === "4") {
			handleError(12)
		} else {
			handleError()
		}
		modalCloseElement.classList.remove("noShown");
	}
    
};

const submitMsg = async () => {
    const nameStr = msgNameElement.value;
	const schoolNameStr = schoolNameElement.value;
    const personalNumStr = msgPersonalNumberElement.value;
    const msgBodyStr = msgBodyElement.value;
    if (!nameStr || !msgBodyStr) {
        alert("名前もしくは本文が入力されていません。");
        return;
    }
    const reqBody = {
        name: nameStr,
		schoolName: schoolNameStr,
        personalNum: personalNumStr,
        msgBody: msgBodyStr
    };
    const res = await fetch("/submitMsg", {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(reqBody)
    });

	if (res.status.toString()[0] === "4") {
		alert(`エラーが発生しました。もう一度お試しください。(${res.status})`)
        return
	} else if (!res.ok) {
		alert(`サーバーエラーが発生しました。もう一度お試しください。(${res.status})`)
        return
	}

	alert("送信が正常に完了しました。")
};