"use strict;";

import { create } from "domain";
import {
   App,
   Editor,
   MarkdownView,
   Modal,
   Notice,
   Plugin,
   PluginSettingTab,
   Setting,
} from "obsidian";
import { getAPI, DataviewApi } from "obsidian-dataview";

interface oBroSettings {
   searchTags: string;
   viewListItems: boolean;
   searchPath: string;
   viewHiddenFiles: boolean;
   taskHeaderSize: number;
}

const DEFAULT_SETTINGS: oBroSettings = {
   searchTags: "",
   viewListItems: false,
   searchPath: "",
   viewHiddenFiles: false,
   taskHeaderSize: 5,
};

let statusBar: HTMLElement;

export default class oBro extends Plugin {
   settings: oBroSettings;

   // observer: MutationObserver | null = null;
   // makeHeadersSticky() {
   //    console.log("oBro: makeHeadersSticky");
   //    // Get all headers in the document
   //    const headers = document.querySelectorAll("h1, h2, h3");

   //    console.log(headers);

   //    headers.forEach(header => {
   //       // Make header sticky
   //       header.style.position = "sticky";
   //       header.style.top = "0";
   //       header.style.zIndex = "1000";
   //       header.style.backgroundColor = "white"; // Change as per your theme
   //    });
   // }

   async onload() {
      await this.loadSettings();
      this.app.workspace.onLayoutReady(() => {
         // check if dv plugin is enabled
         if (this.app.plugins.plugins["dataview"]) {
            console.log(`oBro ${this.manifest.version}: DataView plugin is ready.`);
         } else {
            console.error(`oBro ${this.manifest.version}: DataView plugin not enabled.`);
         }

         statusBar = this.addStatusBarItem();
         statusBar.createEl("span", { text: "oBro's ready!" });
         statusBar.createEl("span", { text: "" });
         statusBar.createEl("span", { text: "" });

         // // register dataview command
         // this.addCommand({
         //     id: 'view-pages-recent',
         //     name: 'View Pages Recent',
         //     callback: () => {
         //         this.app.commands.executeCommand("dataview:run-query", { query: "viewPagesRecent" });
         //     }
         // });
      });

      // Wait for Obsidian to be fully loaded
      //addEventListener('DOMContentLoaded', function () {
      // console.log(this.app.workspace);
      // this.registerEvent(
      //    this.app.workspace.on("quick-preview", () => {
      //       console.log('oBro: "editor-preview" event has fired!');
      //       this.makeHeadersSticky();
      //    })
      // );

      // this.observer = new MutationObserver(() => {
      //    this.makeHeadersSticky();
      // });

      // const documentBody = document.querySelector("body");
      // if (documentBody) {
      //    this.observer.observe(documentBody, { childList: true, subtree: true });
      // }

      this.addSettingTab(new oBroSettingsTab(this.app, this));

      window.viewPagesRecent = async (dv, args) => {
         // TODO: update to use global dv instead of passed. Need to understand why createEl errors appear

         if (window.app.plugins.plugins.dataview) {
            // let dv = window.app.plugins.plugins.dataview.api;
            // let dv2 = getAPI(window.app);
            // console.log("dv: ", dv, dv2);

            ctx.getContext(this.settings, dv, args);
            // suppress this page only, it is not a valid report
            if (ctx.searchPath == ".") ctx.searchPath = "";
            let p = await dv
               .pages(ctx.searchPath == "." ? "" : ctx.searchPath)
               .sort(t => -t.file.mtime.ts);
            await dv.table(
               [
                  "File",
                  "Tasks",
                  "Last Modified",
                  "Size",
                  "Folder",
                  ctx.viewHiddenFiles ? "Visible" : "",
               ],
               p
                  .where(p => isFileVisible(p.file.path, ctx.viewHiddenFiles))
                  .map(p => [
                     p.file.link,
                     p.file.tasks.length,
                     p.file.mtime,
                     p.file.size,
                     p.file.folder,
                     ctx.viewHiddenFiles ? isFileVisible(p.file.path) : "",
                  ])
            );
         } else {
            console.error("DataView plugin is not enabled");
         }
      };

      window.helpPages = async (dv, args) => {
         dv.header(5, "Page Management");
         dv.span("The following commands are available to manage pages:");
         dv.span("- **`viewPagesRecent(dv, args)`** - Lists pages sorted by last modified date");

         dv.span("Use the following arguments to filter the pages displayed");
         dv.span(
            "- **`searchPath`** - Filter tasks by path\n" +
               "\tExamples:\n" +
               "\t\t`{searchPath: '.'}` searches just this page\n" +
               "\t\t`{searchPath: '\"path/to/folder\"'}` searches a folder and subfolders\n" +
               "\tOmitting the argument searches all pages"
         );
         dv.span(
            "- **`viewHiddenFiles`** - Include hidden files in the search\n"
            + "\tDirectories and files starting with `_` are hidden\n"
            + "\tUse the argument to include them in the search\n"
            + "\tExamples:\n"
            + "\t\t`{viewHiddenFiles: true}`"
         );
      };

      window.viewTaskStages = async (dv, args) => {
         await tsks.update(this.settings, dv, args);
         let md = await dv.markdownTable(
            ["Stage", "Qty"],
            [
               ["Overdue", tsks.overdue.length],
               ["This Week", tsks.thisWeek.length],
               ["Next Week", tsks.nextWeek.length],
               ["Started", tsks.started.length],
               ["Backlog", tsks.notPrioritized.length],
               ["Completed", tsks.completed.length],
            ]
         );
         await dv.span(md);
      };

      window.viewTaskProgression = async (dv, args) => {
         await tsks.update(this.settings, dv, args);
         let md = await dv.markdownTable(
            ["In Progress", "Backlog", "Completed", "Total"],
            [
               [
                  tsks.overdue.length +
                     tsks.thisWeek.length +
                     tsks.nextWeek.length +
                     tsks.started.length,
                  tsks.notPrioritized.length,
                  tsks.completed.length,
                  tsks.overdue.length +
                     tsks.thisWeek.length +
                     tsks.nextWeek.length +
                     tsks.started.length +
                     tsks.notPrioritized.length +
                     tsks.completed.length,
               ],
            ]
         );
         await dv.span(md);
      };

      window.viewTasksPrioritized = async (dv, args) => {
         await tsks.update(this.settings, dv, args);
         await tsks.show(
            dv,
            "Overdue",
            tsks.overdue.sort(s => s.due, "desc")
         );
         await tsks.show(
            dv,
            "This Week",
            tsks.thisWeek.sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "Next Week",
            tsks.nextWeek.sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "In Progress",
            tsks.started.sort(s => s.start, "asc")
         );
         await tsks.show(
            dv,
            "Completed Recently",
            tsks.completed.where(w => w.completion >= ctx.so4wa).sort(s => s.completion, "asc")
         );
         await tsks.show(
            dv,
            "Cancelled",
            tsks.notPrioritized.where(w => w.viewStatus == "-")
         );
      };

      window.viewTasksPlanning = async (dv, args) => {
         await tsks.update(this.settings, dv, args);
         await tsks.show(
            dv,
            "Prioritize",
            tsks.notPrioritized.where(t => t.status == "!").sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "Open Questions",
            tsks.notPrioritized.where(t => t.status == "?").sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "Schedule",
            tsks.notPrioritized.where(t => t.status == ">").sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "Review",
            tsks.notPrioritized.where(t => t.status == "R").sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "Backlog",
            tsks.notPrioritized.where(t => t.status == " ").sort(s => s.due, "asc")
         );
      };

      window.viewTasksIdeation = async (dv, args) => {
         await tsks.update(this.settings, dv, args);
         await tsks.show(
            dv,
            "Ideas",
            tsks.notPrioritized.where(t => t.status == "i").sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "Bookmarks",
            tsks.notPrioritized.where(t => t.status == "b").sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "Pros",
            tsks.notPrioritized.where(t => t.status == "p").sort(s => s.due, "asc")
         );
         await tsks.show(
            dv,
            "Cons",
            tsks.notPrioritized.where(t => t.status == "c").sort(s => s.due, "asc")
         );
      };

      // info about using the task tools
      window.helpTasks = async (dv, args) => {
         dv.header(tsks.headerSize, "Task Management");
         dv.span("###### The following commands are available to manage tasks");
         dv.span("- **`viewPagesRecent(dv, args)`** - Lists pages sorted by last modified date");
         dv.span("- **`viewTaskStages(dv, args)`** - Shows task stages and quantities");
         dv.span("- **`viewTaskProgression(dv, args)`** - Shows overall task progression");
         dv.span("- **`viewTasksPrioritized(dv, args)`** - Shows prioritized tasks by status");
         dv.span("- **`viewTasksPlanning(dv, args)`** - Shows tasks ready for planning");
         dv.span("- **`viewTasksIdeation(dv, args)`** - Shows tasks needing ideation");

         dv.span("Use the following arguments to filter the tasks");
         dv.span(
            "- **`searchPath`** - Filter tasks by path\n" +
               "\tExamples:\n" +
               "\t\t`{searchPath: '.'}` searches just this page\n" +
               "\t\t`{searchPath: '\"path/to/folder\"'}` searches a folder and subfolders\n" +
               "\tOmitting the argument searches all pages"
         );
         dv.span(
            "- **`viewHiddenFiles`** - Include hidden files in the search\n"
            + "\tDirectories and files starting with `_` are hidden\n"
            + "\tUse the argument to include them in the search\n"
            + "\tExamples:\n"
            + "\t\t`{viewHiddenFiles: true}`"
         );

         dv.span("###### Task notations");
         dv.span("**Task Status**");
         dv.span("- [ ] to-do [ ]");
         dv.span("- [/] in process [/]");
         dv.span("- [x] completed [x]");
         dv.span("- [-] cancelled [-]");

         dv.span("**Planning & Organization**");
         dv.span("- [!] priority [!]");
         dv.span("- [?] question [?]");
         dv.span("- [>] schedule [>]");
         dv.span("- [R] review [R]");

         dv.span("**Ideation & Reference**");
         dv.span("- [i] idea [i]");
         dv.span("- [b] bookmark [b]");
         dv.span("- [p] pro [p]");
         dv.span("- [c] con [c]");
      };

      window.viewTags = async (dv, args) => {
         tags.update(this.settings, dv, args);
         // let list = tags.filter(ctx.searchTags);
         // tags.view(dv, "Tags", list);
      };

      window.viewTagsAIs = async (dv, args) => {
         tags.update(this.settings, dv, args);
         tags.view(
            dv,
            "Action Items",
            tags.all.where(w => w.tags.startsWith("#ai/"))
         );
      };

      window.viewTagsApps = async (dv, args) => {
         tags.update(this.settings, dv, args);
         tags.view(
            dv,
            "Applications",
            tags.all.where(w => w.tags.startsWith("#ap/"))
         );
      };

      window.viewTagsDiscussions = async (dv, args) => {
         tags.update(this.settings, dv, args);
         tags.view(
            dv,
            "Discussions",
            tags.all.where(w => w.tags.startsWith("#d/"))
         );
      };

      window.viewTagsProjects = async (dv, args) => {
         tags.update(this.settings, dv, args);
         tags.view(
            dv,
            "Projects",
            tags.all.where(w => w.tags.startsWith("#p/"))
         );
      };

      window.helpTags = async (dv, args) => {
         console.log(getAPI(window.app).pages());
         dv.header(tsks.headerSize, "Tag Management");
         dv.span("The following commands are available to manage tags:");
         dv.span("- **`viewTags(dv, args)`** - Lists tags sorted in alphabetical order");
         // dv.span("- **`viewTagsAIs(dv, args)`** - Lists action items");
         // dv.span("- **`viewTagsApps(dv, args)`** - Lists applications");
         // dv.span("- **`viewTagsDiscussions(dv, args)`** - Lists discussions");
         // dv.span("- **`viewTagsProjects(dv, args)`** - Lists projects");

         dv.span("Use the following arguments to filter the tags");
         dv.span(
            "- **`searchTags`** - Filter tags by starting text\n"
            + "\tExamples:\n"
            + "\t\t`{searchTags: '#Proj1'}` - displays tags starting with #Proj1\n"
            + "\t\t`{searchTags: ''}` - displays all tags\n"
            + "\t\t`{searchTags: ['#Proj1', '#Proj2']}` - arrays may be used for a list of tags\n"
            + "\tOmitting the argument displays all tags"

         );
         dv.span(
            "- **`viewListItems`** - Include tags in list items/bullets"
            + "\tBy default, only tags in tasks are displayed.\n"
            + "\tTags in list items are not included in the search\n"
            + "\tUse the argument to include them in the search\n" 
            + "\tExample:\n"
            +"\t\t`{viewListItems: true}`"
         );
         dv.span(
            "- **`searchPath`** - Filter tasks by path\n" +
               "\tExamples:\n" +
               "\t\t`{searchPath: '.'}` searches just this page\n" +
               "\t\t`{searchPath: '\"path/to/folder\"'}` searches a folder and subfolders\n" +
               "\tOmitting the argument searches all pages"
         );
         dv.span(
            "- **`viewHiddenFiles`** - Include hidden files in the search\n"
            + "\tDirectories and files starting with `_` are hidden\n"
            + "\tUse the argument to include them in the search\n"
            + "\tExample:\n"
            + "\t\t`{viewHiddenFiles: true}`"
         );

         // dv.span("Use the following prefixes to filter the tags in `searchTags`");
         // dv.span("- **`#ai/NAME`** - action item with `NAME`");
         // dv.span("- **`#ap/APP`** - application `APP`");
         // dv.span("- **`#d/NAME`** - discussion with `NAME`");
         // dv.span("- **`#p/NAME`** - project `NAME`");
      };

      this.registerMarkdownCodeBlockProcessor("dash", (src, el, ctx) => {
         console.log("dash", src, "<-- source", el, ctx);
         let cards = [
            {
               title: "Calendar",
               content: `
               [[Calendar Actions]] 
               [[Recent Updates]] 
               [[Priorities]] 
               [[Obsidian Notes]]`,
            },
            {
               title: "Tasks",
               content: `
               [[Task Stages]] 
               [[Task Progression]] 
               [[Tasks Prioritized]] 
               [[Tasks Planning]] 
               [[Tasks Ideation]]
               [[Help Tasks]]`,
            },
            {
               title: "Tags",
               content: `
               [[All Tags]] 
               [[Action Items]] 
               [[Applications]] 
               [[Discussions]] 
               [[Projects]]
               [[Help Tags]]`,
            },
         ];
         const container = createEl("div", { cls: "obro-container" });
         cards.forEach(c => {
            let t = "";
            c.content.split("\n").forEach(item => {
               const l = item.trim().replace("[[", "").replace("]]", "");
               if (l) {
                  t += `<a href="obsidian://open?file=${l.replace(/ /g, "%20")}.md">${l}</a><br>`;
               }
            });
            container.appendChild(dash.addCard(c.title, t));
         });
         el.appendChild(container);
      });

      // (window.addMemoFields = (memoTitle, memoContent) => {
      //    const editor = this.app.workspace.activeLeaf.view.sourceMode.cmEditor;

      //    // Generate current date in YYYY-MM-DD format
      //    const currentDate = new Date().toISOString().split("T")[0];

      //    // Markdown template for memo fields
      //    const memoFieldsMarkdown = `
      //        \n## Memo: ${memoTitle}
      //        \n- **Date:** ${currentDate}
      //        \n- **Content:** ${memoContent}
      //        \n`;

      //    // Insert memo fields into the document
      //    editor.replaceSelection(memoFieldsMarkdown);
      // }),
      //    // NEED TO MAKE THIS USEFUL
      //    this.addCommand({
      //       id: "add-memo-fields",
      //       name: "Add Memo Fields",
      //       hotkeys: [{ modifiers: ["Mod", "Shift"], key: "o" }],
      //       editorCallback: (editor: Editor) => {
      //          window.addMemoFields("Test Memo", "Blah, Blah, Blah");
      //       },
      //    });
   }

   onunload() {
      // TODO: add unload code
   }

   async loadSettings() {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
      console.error(`oBro ${this.manifest.version}: Settings are loaded!`, this.settings);
   }

   async saveSettings() {
      await this.saveData(this.settings);
      console.error(`oBro ${this.manifest.version}: Settings are saved!`, this.settings);
   }
}

class oBroSettingsTab extends PluginSettingTab {
   plugin: oBro;

   constructor(app: App, plugin: oBro) {
      super(app, plugin);
      this.plugin = plugin;
   }

   display() {
      this.containerEl.empty();
      this.containerEl.createEl("h1", { text: "General Settings" });

      this.containerEl.createEl("b", { text: " " });
      // this.containerEl.createEl("hr", { text: " " });
      this.containerEl.createEl("h2", { text: "Search Pages" });
      new Setting(this.containerEl)
         .setName("Search Path")
         .setDesc("Enter a path relative to the vault or `.` for the current page only.")
         .addText(text =>
            text
               .setPlaceholder("Enter the path or leave blank for all.")
               .setValue(this.plugin.settings.searchPath)
               .onChange(async value => {
                  this.plugin.settings.searchPath = value;
                  await this.plugin.saveSettings();
               })
         );
      new Setting(this.containerEl)
         .setName("View Hidden Pages")
         .setDesc(
            "Include pages and subdirectories starting with `_`. These are usually hidden from view."
         )
         .addToggle(toggle =>
            toggle.setValue(this.plugin.settings.viewHiddenFiles).onChange(async value => {
               this.plugin.settings.viewHiddenFiles = value;
               await this.plugin.saveSettings();
            })
         );

      this.containerEl.createEl("b", { text: " " });
      // this.containerEl.createEl("hr", { text: " " });
      this.containerEl.createEl("h2", { text: "Search Tags" });
      new Setting(this.containerEl)
         .setName("Search Tag")
         .setDesc("Search for tasks starting with the tag. Leave blank for all tags.")
         .addText(text =>
            text
               .setPlaceholder("Enter the tag or leave blank for all.")
               .setValue(this.plugin.settings.searchTags)
               .onChange(async value => {
                  this.plugin.settings.searchTags = value;
                  await this.plugin.saveSettings();
               })
         );
      new Setting(this.containerEl)
         .setName("View List")
         .setDesc("Include bullets (list items) in the search. These are usually hidden from view.")
         .addToggle(toggle =>
            toggle.setValue(this.plugin.settings.viewListItems).onChange(async value => {
               this.plugin.settings.viewListItems = value;
               await this.plugin.saveSettings();
            })
         );

      this.containerEl.createEl("b", { text: " " });
      // this.containerEl.createEl("hr", { text: " " });
      this.containerEl.createEl("h2", { text: "Task Formatting" });
      new Setting(this.containerEl)
         .setName("Header Size")
         .setDesc("Enter a size from 1 - 6.")
         .addText(text =>
            text
               .setPlaceholder("5")
               .setValue("" + this.plugin.settings.taskHeaderSize)
               .onChange(async value => {
                  let parsed = parseInt(value);
                  if (isNaN(parsed)) return;
                  if (parsed < 1 || parsed > 6) return;
                  this.plugin.settings.taskHeaderSize = parsed;
                  await this.plugin.saveSettings();
                  tsks.headerSize = parsed;
                  // console.log(`oBro: Header Size`, this.plugin.settings, tsks.headerSize);
               })
         );

      // this.containerEl.createEl("h2", { text: "Date Settings" });
      // new Setting(this.containerEl)
      //     .setName("Enable Inline Queries")
      //     .setDesc("Enable or disable executing regular inline Dataview queries.")
      //     .addToggle(toggle => toggle
      //         .setValue(this.plugin.settings.enableInlineDataview)
      //         .onChange(async (value) => await this.plugin.updateSettings({ enableInlineDataview: value })
      //         )
      //     );
      // new Setting(this.containerEl)
      //     .setName("Enable Inline Queries")
      //     .setDesc("Enable or disable executing regular inline Dataview queries.")
      //     .addToggle(toggle => toggle
      //         .setValue(this.plugin.settings.enableInlineDataview)
      //         .onChange(async (value) => await this.plugin.updateSettings({ enableInlineDataview: value })
      //         )
      //     );

      //     .setDesc("Size of headers presented with with view.")
      // this.containerEl.createEl("b", { text: " " });
      // this.containerEl.createEl("h2", { text: "Display Preferences" });
      // new Setting(this.containerEl)
      //     .setName("Header Size")
      //     .addToggle(toggle => toggle
      //         .setValue(this.plugin.settings.enableInlineDataview)
      //         .onChange(async (value) => await this.plugin.updateSettings({ enableInlineDataview: value })
      //         )
      //     );
      // new Setting(this.containerEl)
      //     .setName("Enable Inline Queries")
      //     .setDesc("Enable or disable executing regular inline Dataview queries.")
      //     .addToggle(toggle => toggle
      //         .setValue(this.plugin.settings.enableInlineDataview)
      //         .onChange(async (value) => await this.plugin.updateSettings({ enableInlineDataview: value })
      //         )
      //     );
   }
}

// -------------
// Files & Pages
// -------------

// todo - check if file is hidden
function isFileVisible(f, viewHiddenFiles) {
   try {
      //if (f == '') return false;
      if (viewHiddenFiles) return true;
      const pathParts = f.split("/");
      // console.log(`pathParts`, pathParts, f);
      let i = pathParts.length - 1;
      while (i >= 0) {
         // console.log(`pathParts[`, i, `] "`, pathParts[i], `"`);
         if (pathParts[i].startsWith("_")) return false;
         --i;
      }
      return true;
   } catch (err) {
      console.error("Error: ", err.message);
      return false;
   }
}

// ------------------
// Context Management
// ------------------

let ctx = {
   today: {},
   sow: {},
   eow: {},
   eonw: {},
   so4wa: {},

   searchTags: null,
   viewListItems: null,
   searchPath: null,
   viewHiddenFiles: null,
   headerSize: {},

   // add param to override today
   updateDates(dv) {
      const { DateTime } = dv.luxon;
      this.today = dv.date("today");
      this.sow = this.today.plus({ days: -(this.today.weekday % 7) });
      this.eow = this.sow.plus({ days: 7, milliseconds: -1 });
      this.eonw = this.eow.plus({ days: 7 });
      this.so4wa = this.sow.plus({ days: -28 });
      // console.log(`oBro: updateDates`, today, sow, eow, eonw, so4wa);
   },

   updateCriteria(settings, dv, args) {
      this.searchTags = settings.searchTags;
      this.viewListItems = settings.viewListItems;
      this.searchPath = settings.searchPath;
      this.viewHiddenFiles = settings.viewHiddenFiles;
      this.headerSize = settings.taskHeaderSize;
      if (args) {
         if (args.searchTags) this.searchTags = args.searchTags;
         if (args.viewListItems) this.viewListItems = args.viewListItems;
         if (args.searchPath) this.searchPath = args.searchPath;
         if (args.viewHiddenFiles) this.viewHiddenFiles = args.viewHiddenFiles;
      }
   },

   getContext(settings, dv, args) {
      this.updateDates(dv);
      this.updateCriteria(settings, dv, args);
   },
};

// ---------------
// Task Management
// ---------------

let tsks = {
   getAllTs: 0,
   sortTs: 0,
   all: [],
   overdue: [],
   thisWeek: [],
   nextWeek: [],
   started: [],
   notPrioritized: [],
   completed: [],
   headerSize: 5,

   async getAll(dv, args) {
      this.all = [];
      this.getAllTs = null;
      // console.log("pages", dv.pages(ctx.searchPath), "path", ctx.searchPath, ".");
      try {
         if (ctx.searchPath == "." || ctx.searchPath == '"."')
            this.all = await dv.current().file.tasks;
         else
            this.all = await dv
               .pages(ctx.searchPath)
               .where(p => isFileVisible(p.file.path, ctx.viewHiddenFiles)).file.tasks;
         this.getAllTs = Date.now();
      } catch (err) {
         console.error("oBro: tsks.getAll fail: ", err.message, ctx.searchPath);
      }
      // console.log(`oBro: getAllTs`, this.all, this.getAllTs, Date.now() - this.getAllTs);
      return;
   },

   async sort(dv) {
      this.overdue = [];
      this.thisWeek = [];
      this.nextWeek = [];
      this.started = [];
      this.notPrioritized = [];
      this.completed = [];
      this.sortTs = null;
      try {
         for (let t of this.all) {
            if (t.completed) {
               if (ctx.so4wa <= t.completion) this.completed.push(t);
            } else if (!t.due) {
               if (t.start && t.start <= ctx.today) this.started.push(t);
               else {
                  // console.log("Task", t, this.notPrioritized);
                  this.notPrioritized.push(t);
               }
            } else if (t.due && t.due < ctx.today) this.overdue.push(t);
            else if (ctx.sow <= t.due && t.due <= ctx.eow) this.thisWeek.push(t);
            else if (ctx.eow < t.due && t.due <= ctx.eonw) this.nextWeek.push(t);
            else if (t.start && t.start <= ctx.today) this.started.push(t);
         }
         this.overdue = dv.array(this.overdue);
         this.thisWeek = dv.array(this.thisWeek);
         this.nextWeek = dv.array(this.nextWeek);
         this.started = dv.array(this.started);
         this.notPrioritized = dv.array(this.notPrioritized);
         this.completed = dv.array(this.completed);
         this.sortTs = Date.now();
      } catch (err) {
         console.error("oBro: tsks.sort fail: ", err.message);
      }
      // console.log(`oBro: sortTs`, this.overdue, this.thisWeek, this.nextWeek, this.started, this.notPrioritized, this.completed, this.sortTs);
      statusBar.children[0].setText(
         `Overdue: ${this.overdue.length}  This Week: ${this.thisWeek.length}`
      );
      return;
   },

   async update(settings, dv, args) {
      // console.log(`Settings: `, settings, dv, args);
      // console.log(`header size: `, settings.taskHeaderSize, tsks.headerSize);
      tsks.headerSize = settings.taskHeaderSize;
      ctx.getContext(settings, dv, args);
      await this.getAll(dv, args);
      await this.sort(dv);
   },

   async show(dv, title, tasks) {
      if (!tasks || !tasks.length) return;
      await dv.header(this.headerSize, title + " (" + tasks.length + ")");
      await dv.taskList(tasks, false);
   },
};

// ---------------
// Tags Management
// ---------------

let tags = {
   all: [],
   unique: [],
   tagTs: 0,
   headerSize: 5,

   async getAll(dv, args) {
      this.all = [];
      this.tagTs = null;
      // console.log("ctx", ctx);
      try {
         if (ctx.searchPath == '"."' || ctx.searchPath == ".")
            this.all = await dv.current().file.lists.where(t => t.tags.length > 0);
         else
            this.all = await dv
               .pages(ctx.searchPath)
               .where(p => isFileVisible(p.file.path, ctx.viewHiddenFiles))
               .file.lists.where(t => t.tags.length > 0);
         this.tagTs = Date.now();
      } catch (err) {
         console.error("oBro: tags.getAll fail: ", err.message);
      }
   },

   async update(settings, dv, args) {
      ctx.getContext(settings, dv, args);
      // console.log(`oBro: tags.update`, args, settings, ctx);
      await this.getAll(dv, args);
      await tags.view(dv, ctx.searchTags);
   },

   async view(dv, search) {
      let uniqueTags = Array.from(new Set(this.all.tags)).sort();
      let filteredTags = [];

      if (!search || search == "") filteredTags = uniqueTags;
      else {
         let filter = Array.isArray(search) ? search : [search];
         filteredTags = uniqueTags.filter(t => filter.includes(t));
      }
      // console.log(`oBro: tagTs`, this.all, uniqueTags, filteredTags, Date.now() - this.tagTs);

      for (let t of filteredTags) {
         await this.viewTag(
            dv,
            t,
            this.all.where(
               w =>
                  w.tags.includes(t) &&
                  (w.task || ctx.viewListItems) &&
                  w.status != "x" &&
                  w.status != "-"
            )
         );
      }
   },

   async viewTag(dv, title, tag) {
      if (!tag || !tag.length) return;
      await dv.header(this.headerSize, title + " (" + tag.length + ")");
      // console.log(title, tag);
      await dv.taskList(tag, false);
   },
};

// -----------
// URL pasting
// -----------

let URL = {
   isValidURL(url): boolean {
      try {
         new URL(url);
         return true;
      } catch (error) {
         return false;
      }
   },

   async getMdURL(obsidian, url) {
      console.log(window.location.origin);

      if (!this.isValidURL(url)) {
         throw new Error("Invalid URL");
      }
      let p = new Promise(function (resolve) {
         resolve(
            obsidian.requestUrl(url, {
               // resolve(fetch(url, {
               mode: "cors",
               credentials: "include",
               origin: "",
               body: "text",
            })
         );
      });
      const response = await p;
      if (response.status != 200) {
         console.error(response.status);
         throw new Error("Network response was not ok");
      }
      const html = response.text;
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = doc.querySelector("title").innerText;
      // console.log('Title:', title, response);
      return `[${title}](${url})`;
   },
};

// ---------
// Dashboard
// ---------
// function insertGreekedTable() {
//    // const editor = this.app.workspace.activeLeaf.view.sourceMode.cmEditor;

//    // // Create the table element
//    // const table = document.createElement("table"); 

//    // // Apply CSS styling
//    // table.style.borderCollapse = "collapse";
//    // table.style.width = "100%";
//    // table.style.border = "1px solid black";

//    // // Create table rows and cells with greeked text
//    // for (let i = 0; i < 3; i++) {
//    //    const row = document.createElement("tr");
//    //    for (let j = 0; j < 2; j++) {
//    //       const cell = document.createElement("td");
//    //       cell.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
//    //       cell.style.border = "1px solid black";
//    //       cell.style.padding = "8px";
//    //       row.appendChild(cell);
//    //    }
//    //    table.appendChild(row);
//    // }

//    // // Convert the table element to markdown
//    // const tableMarkdown = "```html\n" + table.outerHTML + "\n```";
//    // console.log(tableMarkdown);
//    // // Insert the markdown into the editor
//    // editor.replaceSelection(tableMarkdown);
// }

let dash = {
   addCard(title, content) {
      const card = createEl("div", { cls: "obro-card" });
      card.appendChild(createEl("div", { text: title, cls: "obro-card-title" }));
      card.appendChild(createEl("div", { text: "" }));
      // card.innerHTML += content;  
      return card;
   },
};
