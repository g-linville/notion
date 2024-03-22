import {APIResponseError, Client} from "@notionhq/client"
import {printPageProperties, recursivePrintChildBlocks} from "./src/pages.js"
import {printDatabaseRow} from "./src/database.js";

const command = process.env.command
const query = process.env.query
const id = process.env.id
const apiKey = process.env.GPTSCRIPT_NOTION_TOKEN
const notion = new Client({auth: apiKey})

function printPages(pages) {
    console.log("Pages:")
    for (let page of pages) {
        console.log(`- ID: ${page.id}`)
        if (page.properties.title !== undefined && page.properties.title.title.length > 0) {
            console.log(`  Title: ${page.properties.title.title[0].plain_text}`)
        } else if (page.properties.Name !== undefined && page.properties.Name.title.length > 0) {
            console.log(`  Name: ${page.properties.Name.title[0].plain_text}`)
        }
        console.log(`  URL: ${page.url}`)
        console.log(`  Parent Type: ${page.parent.type}`)
        if (page.parent.type === "database_id") {
            console.log(`  Parent Database ID: ${page.parent.database_id}`)
        } else if (page.parent.type === "page_id") {
            console.log(`  Parent Page ID: ${page.parent.page_id}`)
        } else if (page.parent.type === "block_id") {
            console.log(`  Parent Block ID: ${page.parent.block_id}`)
        }
    }
}

function printDatabases(dbs) {
    console.log("Databases:")
    for (let db of dbs) {
        console.log(`- Title: ${db.title[0].plain_text}`)
        console.log(`  ID: ${db.id}`)
        console.log(`  URL: ${db.url}`)
        if (db.description.length > 0) {
            console.log(`  Description: ${db.description[0].plain_text}`)
        }
        if (db.parent.type !== "") {
            console.log(`  Parent Type: ${db.parent.type}`)
        }
        if (db.parent.type === "database_id") {
            console.log(`  Parent Database ID: ${db.parent.database_id}`)
        } else if (db.parent.type === "page_id") {
            console.log(`  Parent Page ID: ${db.parent.page_id}`)
        } else if (db.parent.type === "block_id") {
            console.log(`  Parent Block ID: ${db.parent.block_id}`)
        }
    }
}

function printSearchResults(res) {
    let pages = []
    let databases = []
    for (let r of res.results) {
        switch (r.object) {
            case "page":
                pages.push(r)
                break
            case "database":
                databases.push(r)
                break
            default:
                console.log("wow")
                break
        }
    }
    if (pages.length > 0) {
        printPages(pages)
    }
    console.log("")
    if (databases.length > 0) {
        printDatabases(databases)
    }
}

async function main() {
    try {
        switch (command) {
            case "search":
                printSearchResults(await notion.search({query: query}))
                break
            case "page":
                await printPageProperties(notion, id)
                console.log("Page Contents:")
                await recursivePrintChildBlocks(notion, id)
                break
            case "database":
                const response = await notion.databases.query({database_id: id})
                // console.log(JSON.stringify(response, null, 2))
                for (const row of response.results) {
                    if (row.object === "page") {
                        await printDatabaseRow(notion, row)
                    }
                }
                break
        }
    } catch (error) {
        // We use console.log instead of console.error here so that it goes to stdout
        if (error instanceof APIResponseError) {
            console.log(error.message)
        } else {
            console.log("Got an unknown error")
        }
    }
}

await main()
