import express from "express";
import path from "path";
import process from "process";
import jsdom, { JSDOM } from "jsdom";
const app = express();
const port = 3000;

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", () => {
    // No-op to skip console errors.
});

function scrub(text) {
    return text?.replaceAll(/[\t\n]/g, "");
}

async function fetchSite({
    dateMod,
    itemSelector,
    titleSelector,
    dateSelector,
    dateAttribute,
    descriptionSelector,
    urlSelector,
    imageSelector,
    url: siteUrl,
    name,
}) {
    // const req = await fetch(siteUrl);
    // const res = await req.text();
    // const doc = new JSDOM(res).window.document;
    const doc = (await JSDOM.fromURL(siteUrl, { virtualConsole })).window.document;

    const items = doc.querySelectorAll(itemSelector);

    return Array.from(items).map((item) => {
        const title = scrub(item.querySelector(titleSelector)?.textContent);
        const dateElement = item.querySelector(dateSelector);
        const rawDate = scrub(dateAttribute ? dateElement?.getAttribute(dateAttribute) : dateElement?.textContent);
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
        itemSelector: ".eventlist-event--upcoming",
        titleSelector: ".eventlist-title",
        dateSelector: ".eventlist-meta-date",
        imageSelector: ".poster",
        urlSelector: ".eventlist-title-link",
        dateMod: (d) => d.replace(/\w,/, ""),
        url: "https://www.4-star-movies.com/calendar-of-events",
        name: "4-Star Theater",
    },
    {
        itemSelector: ".css-13o7eu2 li > div.chakra-linkbox > a.chakra-linkbox__overlay",
        titleSelector: "li .chakra-linkbox header h3",
        dateSelector: "li .chakra-linkbox time", // TODO - this breaks when the time is "tomorrow" - but there's timetamp in the attributes of the element
        imageSelector: "li .chakra-linkbox img",
        urlSelector: "li .chakra-linkbox a",
        dateAttribute: "datetime",
        url: "https://www.livenation.com/venue/KovZpZAJ6nlA/the-masonic-events",
        name: "The Masonic",
    },
    {
        itemSelector: ".content-information",
        titleSelector: ".show-title",
        dateSelector: ".date-show",
        dateAttribute: "content",
        imageSelector: ".img-responsive",
        urlSelector: ".entry a",
        url: "https://billgrahamcivic.com/event-listing/",
        name: "Bill Graham",
    },
    {
        itemSelector: ".event-item",
        titleSelector: ".event-title",
        dateSelector: ".event-date",
        dateMod: (d) => `${d} ${new Date().getFullYear()}`,
        imageSelector: ".event-thumb img",
        urlSelector: ".event-title a",
        url: "https://publicsf.com/calendar/",
        name: "Public Works",
    },
    {
        itemSelector: ".entry",
        titleSelector: ".carousel_item_title_small",
        dateSelector: ".date",
        imageSelector: ".thumb img",
        urlSelector: ".carousel_item_title_small a",
        descriptionSelector: ".title h4",
        url: "https://www.theregencyballroom.com/events",
        name: "The Regency",
    },
    {
        itemSelector: "div:not(.postponed-event) > .tw-event-item",
        titleSelector: ".tw-name a",
        descriptionSelector: ".tw-support",
        dateSelector: ".tw-event-date",
        dateMod: (d) => d?.replaceAll(".", "/") + "/" + new Date().getFullYear(),
        imageSelector: ".tw-image img",
        urlSelector: ".tw-name a",
        url: "http://theindependentsf.com/",
        name: "The Independent",
    },
    {
        itemSelector: "div[data-testid=organizer-profile__future-events] .eds-show-up-mn .eds-event-card-content",
        titleSelector: ".eds-event-card-content__title",
        dateSelector: ".eds-event-card-content__sub-title",
        dateMod: (d) =>
            d.includes("Tomorrow")
                ? new Date().setDate(new Date().getDate() + 1)
                : d.replace(/\w,/, "").replace(/, .*/, "") + " " + new Date().getFullYear(),
        imageSelector: ".eds-event-card-content__image-wrapper img",
        urlSelector: ".eds-event-card-content__primary-content a",
        url: "https://www.eventbrite.com/o/neck-of-the-woods-18588469785",
        name: "Neck of the Woods",
    },
];

async function getItems() {
    const results = [];
    await Promise.all(
        sites.map(async (site) => {
            const start = Date.now();
            console.log(`Fetching ${site.name}...`);
            results.push(...(await fetchSite(site)));
            const end = Date.now();
            const time = (end - start) / 1000;
            console.log(`${site.name} fetched. Took ${time} seconds.`);
        })
    );
    const sortedResults = results
        .filter((i) => new Date(i.date) >= new Date().setDate(new Date().getDate() - 1))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
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
