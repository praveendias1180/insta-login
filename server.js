var express = require('express')
var app = express()
require('dotenv').config()
const { IgApiClient } = require('instagram-private-api');

app.post('/api/login', function (req, res) {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME);
    (async () => {
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD)
        process.nextTick(async () => await ig.simulate.postLoginFlow())

        // Create UserFeed instance to get loggedInUser's posts
        // const userFeed = ig.feed.user(loggedInUser.pk);
        // const myPostsFirstPage = await userFeed.items();
        res.send(loggedInUser)
    })();
})

app.get('/api/feed', function (req, res) {

    const ig = new IgApiClient();
    // You must generate device id's before login.
    // Id's generated based on seed
    // So if you pass the same value as first argument - the same id's are generated every time
    ig.state.generateDevice(process.env.IG_USERNAME);
    // Optionally you can setup proxy url
    ig.state.proxyUrl = process.env.IG_PROXY;
    (async () => {
        // Execute all requests prior to authorization in the real Android application
        // Not required but recommended
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
        // The same as preLoginFlow()
        // Optionally wrap it to process.nextTick so we dont need to wait ending of this bunch of requests
        process.nextTick(async () => await ig.simulate.postLoginFlow());
        // Create UserFeed instance to get loggedInUser's posts
        const userFeed = ig.feed.user(loggedInUser.pk);
        const myPostsFirstPage = await userFeed.items();
        res.send(myPostsFirstPage)
    })();

})

const port = process.env.PORT || 3330
app.listen(port, () => console.log(`Express server started listening on ${port}...`))
