import express from "express";
import path from "path";
import process from "process";
import { JSDOM } from "jsdom";
const app = express();
const port = 3000;

function scrub(text) {
    return text.replaceAll(/[\t\n]/g, "");
}

async function fetchSite({
    dateMod,
    itemSelector,
    titleSelector,
    descriptionSelector,
    urlSelector,
    imageSelector,
    url,
    name,
}) {
    const req = await fetch(url);
    const res = await req.text();
    const doc = new JSDOM(res).window.document;

    const items = doc.querySelectorAll(itemSelector);

    return Array.from(items).map((item) => {
        const title = scrub(item.querySelector(titleSelector).textContent);
        const rawDate = scrub(item.querySelector(descriptionSelector).textContent);
        const url = scrub(item.querySelector(urlSelector).href);
        const image = scrub(item.querySelector(imageSelector).src);

        const date = new Date(dateMod ? dateMod(rawDate) : rawDate).toLocaleDateString();

        return { venue: name, title, date, url, image };
    });
}

const sites = [
    {
        itemSelector: ".now-playing-block__card",
        titleSelector: ".now-playing-block__title",
        descriptionSelector: ".now-playing-block__opening-date",
        urlSelector: ".now-playing-block__frame",
        imageSelector: ".now-playing-block__frame img",
        url: "https://roxie.com/now-playing/",
        name: "Roxie Cinema",
    },
    {
        itemSelector: ".tw-section",
        titleSelector: ".tw-name a",
        descriptionSelector: ".tw-event-date",
        urlSelector: ".tw-more-info-btn",
        imageSelector: ".tw-image img",
        dateMod: (d) => `${d}.${new Date().getFullYear()}`,
        url: "https://www.brickandmortarmusic.com/",
        name: "Brick & Mortar",
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
