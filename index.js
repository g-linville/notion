import {APIResponseError, Client} from "@notionhq/client"
import {printPageProperties, recursivePrintChildBlocks} from "./src/pages.js"
import {printDatabaseRow} from "./src/database.js";
import {printSearchResults} from "./src/search.js";

const command = process.env.command
const query = process.env.query
const id = process.env.id
const apiKey = process.env.GPTSCRIPT_NOTION_TOKEN
const notion = new Client({auth: apiKey})

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
