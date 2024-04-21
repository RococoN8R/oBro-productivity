## oBro Productivity Tools -- Wrangle Tasks and Tags  Like a Pro!

Welcome to the hub of organization, where chaos goes to die and productivity thrives. Say goodbye to hunting down elusive tags and wrangling scattered tasks – with oBro, you'll be in control like never before. oBro knows when you're in a meeting, ideas fly fast and furiously. There's no time to put ideas in the right file or tool. If you don't capture it in your current notes document, it could be forgotten. oBro does the work for you, collecting, filtering and organizing tasks and tags across your documents when you're ready. 

Alright, so listen up, this is just the beginning. We're talking baby steps in the grand scheme of things. Sure, we might not have all the bells and whistles just yet, but let me tell you why oBro is already miles ahead of the competition. 

## First, my gratuitous plead for help
Making magic happen isn't easy (or cheap). That's where you come in! If you're inspired and want to show some love, consider buying me a coffee ☕️ to keep the creativity flowing and the updates rolling. Every sip counts, and your support means the world. Let's fuel this productivity train together! 

<a href="https://www.buymeacoffee.com/RococoN8R" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-blue.png" alt="Buy Me A Coffee" width=250></a> or <a href="https://ko-fi.com/U7U0X6N0Q" target="_blank"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi" width=250></a>

## Recently Added Gizmos
Alright, alright, don't get too excited. We're just dipping our toes in the water here, folks. This is all we've rustled up—for now, at least. Take a peek and see if any of these babies can jazz up your productivity game!

### Tasks: Your New Ride or Die

Alright, let's talk tasks. Those pesky little things that can make or break your productivity flow. With oBro on your team, you're not just managing tasks – you're owning them. Add them to *any* Obsidian document in your vault, oBro collects them for you! Need to scope out your project? Easy peasy. Prioritizing like a pro? You got it. Brainstorming your next big idea? Absolutely. And with oBro, creativity flows smoother than butter on hot toast.
![[viewTasksPrioritized.png]]

Now buckle up -- oBro's got your back with all the task states you could dream of! Let's break down how they're sorted in each of the reports.
![[viewTaskTypes.png]]


### Tags: Your Secret Sauce to Organization

Tags aren't just for decoration, my friend. They're your secret weapons in the battle against chaos. Dive into our tag system and unlock a whole new level of organization. Whether you're sorting tasks, embedding them in bullets, or just tidying up your digital mess, oBro's got your back.
![[viewTags.png]]

### Bonus! Taming the Document Tsunami

Feeling like you're drowning in a stormy sea of documents? Can't remember which note you updated yesterday? Relax, oBro's got your back! Easily track down recently modified pages, saving you time and keeping you from going nuts trying to find them. Just click on the file to open a new tab!
![[viewPagesRecent.png]]


## Installation: Let's Get Started

1. Go to **Settings** in your [Obsidian](https://www.obsidian.md/). Then go to **Community Plugins** and disable **Safe Mode**. This enables JavaScript libraries to run in your plugins
2. Click on **Browse** and search for _**oBro**_
3. Click **Install**
4. Click the checkbox to enable the oBro plugin

### Required: add Dataview if you don't already use it

5. In **Community Plugins**, click on **Browse** and search for _**Dataview**_. This plugin provides data views powering oBro
6. Click **Install**
7. Click the checkbox to enable the Dataview plugin

### Recommended, but optional

_**Tasks**_, by Clare Macrae, adds due dates, recurring tasks, done dates and sub-set of checklist items. 

8. In **Community Plugins**, click on **Browse** and search for _**Tasks**_. 
9. Click **Install** 
10. Click the checkbox to enable the Tasks plugin




## Basic Usage: Let's Do This!


#### Tasks: Wrangling the Chaos

So, ready to tame the beast that is task management? Here's what you can do:

**Manage Priorities Like a Pro**: Use `viewTasksPrioritized(dv)` to see what's on your plate. Get lists of overdue, due this week, due next week, in progress, and recently completed tasks to keep your priorities straight.

**Plan Like a Boss**: Ready to dive in? `viewTasksPlanning(dv)` lays it all out for you. From managing priorities and tackling open questions to scheduling items, reviewing tasks and managing backlog,  it's your one-stop-shop for getting things done.

**Ideate Away**: Feeling inspired? `viewTasksIdeation(dv)` is where your creative juices flow. Ideas, bookmarks, pros, and cons – it's all there, waiting for you to bring them to life... no perseverating required!

Ready for some advanced maneuvers? Dive into our [[Args & Settings]] document for custom search paths and more. You can even hide files and directories from search, easily. With oBro, you're in control. Let's whip those tasks into shape!

#### Tags

#### Pages


**View Recent Pages**: Get a peek at your recent activity with `viewPagesRecent`.

``` dataviewjs

```

- Tasks
- Tags
- Pages
Alright, let's get serious. Dive deep into oBro's data and querying features. Think of it as your trusty GPS for navigating the vast wilderness of your documents. Find what you need, take action, and get back to conquering the world – all in record time.

### Contributing: We're Better Together

Calling all organization aficionados! Got ideas, bugs to squash, or just wanna chat? Hit us up. We're all about making oBro even more epic, one brainstorm at a time. Got a killer feature in mind? Don't hold back – let's make some magic happen together.

### Support: Spread the Love

If oBro has been your saving grace and you're feeling the love, why not show us some support? Donations keep our motivation sky-high and help fuel future updates. But hey, no need for bribery – we're in it for the love of organization, not the dough. We're cool like that.

So there you have it, folks – your crash course in all things oBro. Ready to revolutionize the way you work? Let's make productivity history together!




## oBro Productivity Tools
## Table of Contents
## Installation
## Usage
## Settings
## Detailed Documentation
	Examples
	APIs
## Contributing
## License
## Acknowledgements
## Contact Information
## Badges
## Screen Shots

-----
The content of your README.md file should be organized in a clear and structured manner to make it easy for users to navigate and find the information they need. Here's a suggested structure for organizing the content:

1. **Title and Description**: Start with a clear and descriptive title for your plugin, followed by a brief description of what it does. This should be the first thing users see when they visit your repository.
    
2. **Table of Contents**: If your README is long or contains multiple sections, consider including a table of contents with links to each section. This allows users to quickly jump to the information they're interested in.
    
3. **Installation**: Provide clear, step-by-step instructions on how to install your plugin. This should include any prerequisites or dependencies that need to be installed beforehand.
    
4. **Usage**: Explain how users can use your plugin. Provide examples and code snippets to demonstrate common use cases. Make sure to cover all the major features and functionalities of your plugin.
    
5. **Configuration**: If your plugin requires any configuration settings, explain how users can configure them. Provide default configurations and explain what each option does.
    
6. **Documentation**: Include links to more detailed documentation if available. This could be in the form of a wiki, documentation website, or inline documentation within the code.
    
7. **Examples**: Include examples of how to use your plugin in real-world scenarios. This helps users understand how your plugin can solve their problems.
    
8. **Contributing**: Encourage contributions from the community by providing guidelines on how users can contribute to your plugin. This could include information on how to report bugs, submit feature requests, or contribute code.
    
9. **License**: Specify the license under which your plugin is distributed. This is important for users to understand their rights and obligations when using your plugin.
    
10. **Acknowledgements**: If your plugin is built on top of other projects or libraries, acknowledge them in your README. This helps give credit to the original authors and fosters a sense of community.
    
11. **Contact Information**: Provide contact information in case users have questions, feedback, or need support. This could be an email address, a link to a discussion forum, or a link to open issues on GitHub.
    
12. **Badges**: Include badges for things like build status, code coverage, or version number. These can provide useful information at a glance.
    
13. **Screenshots or GIFs**: If applicable, include screenshots or GIFs demonstrating your plugin in action. Visual aids can help users understand your plugin more quickly.