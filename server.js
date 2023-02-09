import express from "express";
import path from "path";
import process from "process";
import { JSDOM } from "jsdom";
const app = express();
const port = 3000;

function scrub(text) {
    return text?.replaceAll(/[\t\n]/g, "");
}

async function fetchSite({
    dateMod,
    itemSelector,
    titleSelector,
    dateSelector,
    descriptionSelector,
    urlSelector,
    imageSelector,
    url: siteUrl,
    name,
}) {
    const req = await fetch(siteUrl);
    const res = await req.text();
    const doc = new JSDOM(res).window.document;

    const items = doc.querySelectorAll(itemSelector);

    return Array.from(items).map((item) => {
        const title = scrub(item.querySelector(titleSelector)?.textContent);
        const rawDate = scrub(item.querySelector(dateSelector)?.textContent);
        const url = urlSelector && scrub(item.querySelector(urlSelector)?.href);
        const image = scrub(item.querySelector(imageSelector)?.src);
        const description = descriptionSelector ? scrub(item.querySelector(descriptionSelector)?.textContent) : "";

        const date = new Date(dateMod ? dateMod(rawDate) : rawDate).toLocaleDateString();

        return { description, venue: name, title, date, url: url || siteUrl, image };
    });
}

const sites = [
    {
        itemSelector: ".now-playing-block__card",
        titleSelector: ".now-playing-block__title",
        dateSelector: ".now-playing-block__opening-date",
        urlSelector: ".now-playing-block__frame",
        imageSelector: ".now-playing-block__frame img",
        url: "https://roxie.com/now-playing/",
        name: "Roxie Cinema",
    },
    {
        itemSelector: ".tw-section",
        titleSelector: ".tw-name a",
        dateSelector: ".tw-event-date",
        urlSelector: ".tw-more-info-btn",
        imageSelector: ".tw-image img",
        dateMod: (d) => `${d}.${new Date().getFullYear()}`,
        url: "https://www.brickandmortarmusic.com/",
        name: "Brick & Mortar",
    },
    {
        itemSelector: ".list-view-item",
        titleSelector: "h1.event-name",
        dateSelector: ".detail_event_date",
        descriptionSelector: ".detail_event_subtitle .name",
        urlSelector: ".event-name a",
        imageSelector: ".list-img img",
        dateMod: (d) => `${d} ${new Date().getFullYear()}`,
        url: "https://gamh.com/",
        name: "Great American",
    },
    {
        itemSelector: "#sessionsByDateConent .film",
        titleSelector: ".title",
        dateSelector: ".date",
        imageSelector: ".poster",
        dateMod: (d) => `${d} ${new Date().getFullYear()}`,
        url: "https://ticketing.uswest.veezi.com/sessions/?siteToken=d2atbcege5knqsavntt91g1250",
        name: "4-Star Theater",
    },
    {
        itemSelector: "li .chakra-linkbox",
        titleSelector: "li .chakra-linkbox header h3",
        dateSelector: "li .chakra-linkbox time", // TODO - this breaks when the time is "tomorrow" - but there's timetamp in the attributes of the element
        imageSelector: "li .chakra-linkbox img",
        urlSelector: "li .chakra-linkbox a",
        dateMod: (d) => `${d} ${new Date().getFullYear()}`,
        url: "https://www.livenation.com/venue/KovZpZAJ6nlA/the-masonic-events",
        name: "The Masonic",
    },
];

async function getItems() {
    const results = [];
    for (const site of sites) {
        results.push(...(await fetchSite(site)));
    }
    const sortedResults = results.sort((a, b) => new Date(a.date) - new Date(b.date));
    return sortedResults;
}

app.get("/items", async (req, res) => {
    const items = await getItems();
    res.json(items);
});

app.get("/", (req, res) => {
    var options = {
        root: path.join(process.cwd()),
        dotfiles: "deny",
        headers: {
            "x-timestamp": Date.now(),
            "x-sent": true,
        },
    };
    res.sendFile("/index.html", options);
});

app.get("/feeder.js", (req, res) => {
    var options = {
        root: path.join(process.cwd()),
        dotfiles: "deny",
        headers: {
            "x-timestamp": Date.now(),
            "x-sent": true,
        },
    };
    res.sendFile("/feeder.bundled.js", options);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
