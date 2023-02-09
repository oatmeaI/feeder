import { LitElement, html, css } from "lit";

async function getItems() {
    const req = await fetch("http://localhost:3000/items");
    const res = await req.json();
    return res;
}

export class Item extends LitElement {
    static properties = {
        item: {},
    };

    render() {
        return html`<div>
                <span>${this.item.date} </span>
                <span>(${this.item.venue}) </span>
                <span
                    ><a href=${this.item.url}>${this.item.title}</a>${this.item.description &&
                    html` - ${this.item.description}`}</span
                >
            </div>
            <br />`;
    }
}

export class ItemList extends LitElement {
    static get properties() {
        return {
            itemList: [],
        };
    }

    constructor() {
        super();

        this.itemList = [];
    }

    connectedCallback() {
        super.connectedCallback();

        getItems().then((itemList) => {
            this.itemList = itemList;
            console.log("here1");
        });
    }

    render() {
        console.log("here");
        return html`<div>${this.itemList.map((item) => html`<cool-item .item=${item}></cool-item>`)}</div>`;
    }
}

customElements.define("item-list", ItemList);
customElements.define("cool-item", Item);
