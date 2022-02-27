var express = require('express')
var app = express()
require('dotenv').config()
const { IgApiClient } = require('instagram-private-api');
const { writeFile, readFile, access } = require('fs/promises');
const path = require('path')

async function instaSessionSave(data) {
    console.log("Saving IG Session");
    try {
        // Get a promise
        const promise = writeFile('login-data.txt', JSON.stringify(data));
        // Wait while the promise is being delivered to you.
        await promise;
        console.log('Saved IG Session');
    } catch (err) {
        console.error(err);
    }
    return data;
}

async function instaSessionExists() {
    let data;
    try {
        const promise = access(path.join(__dirname, "login-data.txt"));
        data = await promise;
        return true
    } catch (err) {
        return false;
    }
}

async function instaSessionLoad() {
    let data;
    console.log("Loading IG Session");
    try {
        const promise = readFile('login-data.txt');
        data = await promise;
        console.log('Loaded IG Session');
    } catch (err) {
        console.error(err);
    }
    return JSON.parse(data);
}

app.post('/api/login', function (req, res) {
    (async () => {
        const ig = new IgApiClient();
        ig.state.generateDevice(process.env.IG_USERNAME);
        ig.state.proxyUrl = process.env.IG_PROXY;

        // This function executes after every request
        ig.request.end$.subscribe(async () => {
            const serialized = await ig.state.serialize();
            delete serialized.constants; // this deletes the version info, so you'll always use the version provided by the library
            instaSessionSave(serialized);
        });

        let shouldLogin = true;

        try {
            if (await instaSessionExists()) {
                console.log('Insta Session Exists');
                // import state accepts both a string as well as an object
                // the string should be a JSON object
                let loaded_session = await instaSessionLoad()
                console.log('loaded_session: ' + loaded_session);
                await ig.state.deserialize(loaded_session);
                let userinfo = await ig.user.info(ig.state.cookieUserId);
                console.log('Insta Session Deserialized');
                shouldLogin = false;
                return res.send(userinfo)
            } else {
                console.log('Insta Session Does Not Exist!');
            }
        } catch (e) {
            console.log(e)
            return res.send(e)
        }

        if (shouldLogin) {
            console.log('Should Login!!!')
            // Most of the time you don't have to login after loading the state
            // This call will provoke request.end$ stream
            await ig.simulate.preLoginFlow();
            const loggedInUser = await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
            process.nextTick(async () => await ig.simulate.postLoginFlow());
            return res.send(loggedInUser)
        }
    })();
})

const port = process.env.PORT || 3330
app.listen(port, () => console.log(`Express server started listening on ${port}...`))
