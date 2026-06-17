# The Circle — Welcome email (issue #0)

The email a new Circle member receives the moment they join (`launch_waitlist`).
Founder-voiced (Arnaud). Voice lock: connect/introduce, never sell/book/enroll.
Banned words avoided: transformation, life-changing, vacation, luxury, easy.
Goal: deliver ONE genuinely good thing up front (a real place worth knowing),
end with ONE question that earns a reply. Engagement is the whole metric.

---

**Subject:** Welcome to the Circle — one place worth knowing
*(alternates: "A place, a person, your people" · "You're in. Here's one place worth knowing.")*

**Preheader:** Where we begin: one craft, one town, and the people gathered around it.

---

Hi {{ first_name | default: "there" }},

You're in the Circle. Here's the reason it exists — one place worth knowing.

In Mashiko, a quiet town a couple of hours north of Tokyo, the climbing kilns have breathed for a hundred years. A potter named Shōji Hamada settled there in 1924 and gave his life to a simple idea: that plain, useful, handmade things are worth devoting yourself to. The families who learned beside him never left, and people still come from across the world to put their hands in that clay. Mashiko isn't the prettiest town in Japan. It's something rarer — a place where a craft is genuinely alive, and the right people are gathered around it.

That's the whole idea of the Atlas: a map of places like Mashiko, one craft at a time, ranked not by who pays us, but by the strength of the community you'd find when you arrived.

I'm Arnaud. I cook for a living, and I've spent fifteen years on the water — sailing, freediving, learning my own trade at the source. Pottery isn't my craft, and that is exactly the point: this was never meant to be about me. It's about helping you find the real version of whatever pulls at you, and the people already chasing it.

How the Circle works is short. I don't sell anything. As the Atlas grows, I send you the places and the people worth knowing — and when the moment is right, I introduce you. That's all. Skills last; the rest fades.

When you have two minutes, open the Atlas and find the craft that's been quietly calling you:
educatedtraveler.app/repertoire

And one thing I'd genuinely like to know — just hit reply: **what is the one skill you'd give a real week of your life to learn at the source?**

I read every reply.

Arnaud
EducatedTraveler — a place, a person, your people.

---

## Notes for sending
- **Merge field:** `{{ first_name }}` with a `"there"` fallback (most `launch_waitlist` rows are email-only). Swap to whatever syntax the chosen sender uses (Buttondown `{{ subscriber.first_name }}`, Resend/React-Email prop, etc.).
- **Links:** keep ONE primary CTA (the Atlas) so focus holds. In the HTML version you may also link the word **"Mashiko"** to its page: `educatedtraveler.app/atlas/pottery-and-ceramics--mashiko`.
- **Design:** for HTML, reuse the warmed email template style in `docs/email-templates/` (Georgia wordmark + heading, sea→ember CTA on dark text, warm palette) so it matches the live auth emails. No decorative emoji.
- **The reply is the point:** route replies to a real inbox you read. Every answer is a Phase-2 demand signal and a relationship — log notable ones.
- **Deliverability first:** the welcome email only counts if it lands in the inbox — authenticate the sending domain (SPF/DKIM/DMARC) before the first send (Week-1 roadmap item).
- **Next issues:** keep the same shape — one place/master worth knowing per letter, one question, founder-voiced, links out to one trusted school. Belonging, never a sales list.
