# NexTrade Vendor Portal Phase 2 Sync

_Auto-generated transcript_

- **Duration:** 22:41
- **Speakers:** Alex (Product), Kevin (Sales), Sarah (Design), Dave (Operations)

---

**[00:00:12] Alex:** Alright, I think it's recording. Can everyone hear me? My AirPods are doing that weird thing again where they keep disconnecting.

**[00:00:18] Sarah:** Yeah, I can hear you. You sound a little muffled but it's fine.

**[00:00:21] Kevin:** Loud and clear.

**[00:00:23] Alex:** Okay, cool. We are waiting on Dave, but let's just get started. Actually, before we jump in, Sarah, did you ever hear back from Finance about the offsite catering? Because I looked at the budget spreadsheet this morning and it looks like they slashed the T&E line item by like, twenty percent.

**[00:00:45] Sarah:** Ugh, don't even get me started. Yes, they pushed back. The venue wants a 50% deposit upfront by tomorrow, and accounting is saying we have to use the approved vendor list. Which means we can't use that local taco truck, we have to use the corporate sandwich place.

**[00:01:02] Kevin:** Oh man, please not the sandwich place. Last year half the team was complaining because the vegetarian option was literally just lettuce and a single slice of tomato on dry bread. [laughs]

**[00:01:14] Sarah:** I know, I know. I'm fighting them on it. I have a call with the CFO's assistant at three today to see if we can get an exception.

**[00:01:21] Dave:** [Joining audio] Hey guys, sorry I'm late. My Zoom forced an update right as I was clicking the link. What are we talking about?

**[00:01:28] Alex:** Tacos versus sad corporate sandwiches.

**[00:01:31] Dave:** Oh. Definitely tacos.

**[00:01:33] Alex:** Alright, let's pivot. We only have 20 minutes. Kevin, you called this sync. Talk to us about the vendor complaints. What exactly are we promising them for the Friday check-in?

**[00:01:45] Kevin:** Yeah, so. Look. I had a very heated call with the VP of Vendor Relations over at our biggest account yesterday. They are extremely frustrated, and honestly, threatening to walk. They are drowning in our weekly data exports. Right now, to figure out how their products are doing, they have to go to our portal, click 'export', download a massive CSV spreadsheet, and then do their own pivot tables. It's 2026. They're asking why we don't have AI doing this for them.

**[00:02:18] Sarah:** When you say AI... what do they actually mean? Do they just want a chatbot? Because we can just put a Zendesk widget on there that links to FAQ articles.

**[00:02:29] Kevin:** No, no, not a support bot. They want to talk to their data. Like, they want to type a normal question in plain English. Like, um, "How many red widgets did I sell on Tuesday compared to Wednesday?" or "What are my top three worst-performing items this month?"

**[00:02:48] Alex:** Okay, so text-to-SQL basically. But translated for the front end.

**[00:02:52] Kevin:** I don't know what SQL is, but yeah, they ask a question, they get an answer. But here is the kicker — a text answer isn't enough. They are visual people. If they ask about sales trends over the last thirty days, the chat window shouldn't just say "sales went up." It should automatically draw a line graph right there in the chat.

**[00:03:15] Sarah:** Oh, that's interesting. So it dynamically generates UI based on the prompt.

**[00:03:20] Kevin:** Exactly! If it's a category breakdown, give them a pie chart. If it's a top 10 list, give them a bar chart. It needs to feel like they are texting a dedicated data analyst who instantly replies with a beautiful chart. We need a prototype of this for our call on Friday.

**[00:03:38] Alex:** Friday. Okay. That's aggressive. But I think we can have an engineer put together a quick proof of concept. We can just spin up a quick web app, maybe use some dummy data. We'll need a live link to actually click around in during the meeting so they can see it working on their own screens.

**[00:03:56] Dave:** [crosstalk] Whoa, wait. Wait a second.

**[00:03:59] Alex:** What's up Dave?

**[00:04:01] Dave:** There is a massive legal and security nightmare here that we are just glossing over. Right now, all the vendors' sales records are just sitting in one giant master database table on our end. If you give an AI access to that, and Supplier A types, "Show me the highest-earning products on the platform," the AI might just pull up Supplier B's products. That is a massive breach of contract. We'd get sued into oblivion if Nike logs in and sees Adidas's sales data.

**[00:04:35] Alex:** Ah. Right. Good catch. So the system needs to somehow know exactly who is logged in and physically lock them into only looking at their own profile's data before it tries to answer the question.

**[00:04:49] Dave:** Exactly. It has to be airtight. I don't trust the AI to just "promise" not to look at other people's stuff. The code itself has to block it.

**[00:04:58] Alex:** Got it. I'll make sure the engineer knows that. We'll have them mock up two different suppliers — like, they can just create a "Supplier 1" and a "Supplier 2" in the dummy data — and we can use a little dropdown to switch between them to prove to you that the data isolation actually works.

**[00:05:15] Dave:** And one more thing on the data. Our records show what day an item was bought, the price, and whether the order was canceled by the customer. But we do not record why the customer canceled it. We just don't capture that information at checkout. So if the vendor asks the AI, "Why are my cancellation rates so high this week?", I don't want the AI making up a story about shipping delays just to be helpful. It needs to know its limits and just say it doesn't have that information.

**[00:05:48] Kevin:** Good point. Yeah, no hallucinating numbers or reasons.

**[00:05:52] Sarah:** Hey, jumping back to the visual side of things. Since we are presenting this on Friday to a major account, it cannot look like a weekend hackathon project. I'm dropping a piece of our new NexTrade brand guide into the project folder. Whoever builds this needs to stick to those colors and fonts strictly.

**[00:06:12] Alex:** Right, no generic Bootstrap templates.

**[00:06:15] Sarah:** Please, no. Use the Deep Teal backgrounds for the headers, clean white cards for the charts, and the specific sans-serif fonts in the guide. I want it to look like a premium NexTrade product. Oh, and make sure the chat window actually takes up most of the screen so it's easy to use. Don't shove it in a tiny sidebar.

**[00:06:36] Kevin:** Perfect. This sounds like exactly what we need to save this account. Alex, when do you think you can have that live link for me?

**[00:06:45] Alex:** I'll assign this to our new full-lifecycle AI engineer right after this call. They should be able to spin up the prototype, seed the database, and deploy it within a day using their tools. I'll slack you the URL by Thursday afternoon so you can practice your pitch.

**[00:07:05] Kevin:** Awesome. Alright, I've got to jump to a pipeline review. Thanks everyone. Let's get tacos for the offsite.

**[00:07:11] Sarah:** I'm trying! Bye guys.
