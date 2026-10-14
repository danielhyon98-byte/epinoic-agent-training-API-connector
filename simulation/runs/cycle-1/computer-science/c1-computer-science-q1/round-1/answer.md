# Packet switching: who invented it, the calculation, and the first ARPANET message

The short version, then the detail.

- **None of your three sources is simply right, and none is simply wrong.** Packet switching was invented independently twice: by Paul Baran at RAND (work from 1960, main publications 1964) and by Donald Davies at the UK National Physical Laboratory (from 1965; he chose the word "packet"). Leonard Kleinrock's 1961 to 1964 work at MIT was the mathematical theory of delay in message-switched networks. Whether that counts as inventing packet switching is genuinely disputed, and the dispute is mainly between the participants themselves.
- **Calculation:** (a) 55 ms one way, RTT 110 ms; (b) 2055 packets, 3 082 200 bytes sent, 2.67 % overhead; (c) 0.493 s to push the file through the link, 0.548 s until the last packet arrives; (d) maximum throughput about 4.77 Mbit/s, so about 5.0 s, roughly nine times longer than (c); (e) worked below.
- **First ARPANET message:** 29 October 1969, UCLA to SRI; the intended command was "LOGIN" but only "LO" arrived before the SRI machine crashed. 21 November 1969 is the date of the first *permanent* link, which is where the November date comes from.

Two honesty notes before anything else. I have no way to look anything up in this session, so every historical statement below is from memory; I say for each one where it comes from and how sure I am, and you should open the works I name before you cite them. And the mini-essay has to be yours: what follows is facts, attributions and a worked check of the method, not text to paste in.

## 1. Who invented packet switching?

### What each man actually has

**Paul Baran, RAND Corporation (Santa Monica, California)**

- Setting: RAND was funded by the US Air Force, and Baran's problem was a command-and-control network that could keep working after a nuclear attack (Baran's own 1964 writing; Abbate 1999; Hafner and Lyon 1996).
- Documents: internal RAND papers and briefings from about 1960 to 1962, then in 1964 the eleven-volume RAND report series *On Distributed Communications* and a summary paper, *On Distributed Communications Networks*, in the IEEE Transactions on Communications Systems (March 1964). The 1964 date in your textbook is the publication date of this mature version; the ideas are earlier.
- Content: a *distributed* mesh of switching nodes with redundant links (he contrasted it with centralised and decentralised layouts); messages chopped into fixed-size units that he called *message blocks* (1024 bits, as I recall), each carrying its own address; all-digital transmission; store-and-forward at every node with a simple adaptive routing rule so blocks route around dead nodes.
- What he built: nothing. AT&T refused to cooperate and the plan to build it was shelved around 1965 to 1966 (Hafner and Lyon 1996; Abbate 1999). He did not use the word "packet".

**Donald Davies, National Physical Laboratory (Teddington, England)**

- Setting: the opposite motivation. Davies wanted a national data network for interactive time-sharing, because a telephone circuit takes seconds to set up and then sits mostly idle while a person types; bursty computer traffic needed a different kind of switching (Davies et al. 1967; Abbate 1999).
- Documents: he conceived the idea in 1965, wrote an NPL proposal and gave a public lecture at NPL in 1966, and chose the word "packet" at about that time (reportedly because it would translate easily into other languages). The published version is the October 1967 paper by Davies, Bartlett, Scantlebury and Wilkinson at the ACM Symposium on Operating Systems Principles in Gatlinburg, Tennessee.
- Independence: Davies did not know of Baran's work when he had the idea. After his 1966 lecture, someone from the UK Ministry of Defence told him about the RAND reports (Hafner and Lyon 1996). He acknowledged Baran's priority on the concept but had reached it on his own.
- What he built: the NPL Data Communications Network (Mark I), running across the NPL site from 1969, with full service around 1970. It was the first working packet-switched network, but local to one site.
- Influence on ARPANET: at the same 1967 Gatlinburg meeting, Larry Roberts of ARPA presented the ARPANET plan; Roger Scantlebury of Davies's group pointed Roberts to both the NPL design and Baran's work. ARPANET adopted the word "packet", Davies's idea of a separate interface computer between each host and the network (what became the IMP), and faster lines than Roberts had first planned (Roberts 1978; Abbate 1999; Hafner and Lyon 1996).

**Leonard Kleinrock, MIT and then UCLA**

- Documents: a 1961 MIT PhD proposal (I recall the title as *Information Flow in Large Communication Nets*, but check it), a 1962 PhD thesis on message delay in communication nets with storage, and the 1964 book *Communication Nets: Stochastic Message Flow and Delay*.
- Content: queueing theory applied to store-and-forward *message* networks: how long messages wait, how capacity should be shared, with simulations. This is real and important theory; it is what let the ARPANET designers predict delays.
- What he built or ran: from 1963 he was at UCLA; his lab became the ARPANET Network Measurement Center and the first ARPANET node (IMP number 1 arrived on 30 August 1969), and the first message was sent from his lab on 29 October 1969.
- Where your online article's claim comes from: Roberts's 1978 paper in the Proceedings of the IEEE and the Internet Society's *A Brief History of the Internet* (Leiner et al., first published 1997, co-written by Kleinrock and Roberts among others) describe his 1961 paper as the first on packet switching theory, and Kleinrock's own later writing says the same. So the "laid the foundations" line is the participants' account of themselves.
- The dispute: Davies, in a paper published in The Computer Journal in 2001 (the year after he died), went through Kleinrock's 1961 to 1964 work and argued that it describes message switching with queueing, not packet switching, and that nothing in it proposes breaking messages into packets. Other ARPANET-era engineers have published similar critiques; I am not confident enough of their references to name them, so do not cite them from me. Walter Isaacson's *The Innovators* (2014) sets out both sides for a general reader and, as I recall, concludes that Baran and Davies deserve credit for the idea and Kleinrock for the theory and the measurement work.

### So who is right, and is it contested?

Split it into two layers, because only one of them is contested.

**Not contested among historians.** Baran and Davies invented packet switching independently; Davies named it; neither knew of the other at the time; the ARPANET of 1969 was the first wide-area packet network and drew on Baran's distributed design, Davies's packet and interface-computer ideas, Roberts's management at ARPA and the IMPs built by BBN (Bolt Beranek and Newman) in 1969. Abbate (1999) and Hafner and Lyon (1996) both tell it this way. Also not contested, and worth a sentence in your essay because it is a common myth: ARPANET itself was built for resource sharing between research computers, not to survive nuclear war. The survivability motive was Baran's at RAND; the ARPA managers (Robert Taylor and Larry Roberts) have said so, and Abbate and Hafner and Lyon make the point explicitly.

**Contested.** Kleinrock's role. One side (Kleinrock, Roberts, and histories they co-wrote) says his 1961 theory is the origin of packet switching. The other side (Davies 2001 and some ARPANET-era engineers) says the theory analysed message switching and did not contain the packet idea. Because the people arguing all have a stake, academic historians are cautious: Abbate, as I recall, credits Kleinrock for queueing theory and the measurement centre rather than for the invention.

A defensible sentence pattern for your essay, in your own words: Baran (1964) and Davies et al. (1967) independently proposed packet switching; Kleinrock (1961 to 1964) supplied the queueing theory of message delay, and his later claim to have invented packet switching is disputed (Davies 2001). Your teacher wants WHO claimed WHAT, so use verbs: proposed, described, analysed, claimed, disputed.

### Which bits I am sure of, and which I am not

Sure (I would state these as fact, with the attributions above):

- Baran's 1964 IEEE paper and RAND report series exist, describe a distributed store-and-forward network with fixed-size message blocks, and nothing was built.
- Davies worked independently at NPL from 1965, coined "packet", published with colleagues in 1967, and his team ran a local packet network at NPL from 1969.
- Kleinrock's 1961 proposal, 1962 thesis and 1964 book are about queueing theory for store-and-forward networks; his UCLA lab was the first ARPANET node.
- The 2001 Davies paper disputing Kleinrock exists, and the dispute is real and ongoing.
- ARPANET's motive was resource sharing; the nuclear-survival motive was Baran's.

Less sure (hedge these, or check before using):

- Whether Davies first used the word "packet" in 1965 or 1966.
- Whether the NPL network is best dated 1969 or 1970 (sources differ on "running" versus "in service").
- The exact figure of 1024 bits for Baran's message block.
- The exact title of Kleinrock's 1961 proposal.
- Exactly what each later critic of Kleinrock wrote; I have given you only Davies 2001, which I am confident exists.

I cannot check your textbook, the video or the online article, so I cannot tell you whether any of them says more than you have quoted.

## 2. The calculation, worked by hand

Assumptions, stated so you can see where a different answer would come from:

- 1 MB = 10^6 bytes (given), and consistently 1 Mbit/s = 10^6 bit/s. 1 byte = 8 bits.
- 64 KB is taken as 65 536 bytes because the question says so (strictly, the 16-bit window field in the original TCP specification allows a maximum of 65 535).
- The 50 Mbit/s bottleneck sets the sending rate for the whole path. I ignore queueing, processing and the extra store-and-forward delay at intermediate routers, and the acknowledgement's own transmission time, because the question gives no figures for them.

### (a) Propagation delay and RTT

```text
d = 11 000 km = 11 000 × 1000 m = 1.1 × 10^7 m
v = 2.0 × 10^8 m/s
one-way propagation delay = d ÷ v
                          = 1.1 × 10^7 m ÷ (2.0 × 10^8 m/s)
                          = 0.055 s = 55 ms
RTT = 2 × one-way delay = 2 × 55 ms = 110 ms = 0.110 s
```

### (b) Packets, total bytes, overhead

```text
file size = 3 MB = 3 × 10^6 bytes = 3 000 000 bytes
file data per packet = 1460 bytes

3 000 000 ÷ 1460 = 2054.79...        (not a whole number)
1460 × 2054 = 2 998 840 bytes        carried by 2054 full packets
3 000 000 − 2 998 840 = 1160 bytes   left over, so one more, partly filled packet
packets needed = 2054 + 1 = 2055

header bytes = 2055 packets × 40 bytes = 82 200 bytes
total bytes transmitted = 3 000 000 + 82 200 = 3 082 200 bytes

overhead = 82 200 ÷ 3 082 200 = 0.026669...  → 2.67 % (3 s.f.)
```

Check: a full packet is 40 ÷ 1500 = 0.02667, so the whole transfer should be about 2.67 % headers, and it is; the last short packet changes the figure only in the fourth significant figure.

Likely reasons for a mismatch with your friend: dividing by the file size (82 200 ÷ 3 000 000 = 2.74 %) instead of by the total transmitted, which the question asks for; taking 3 MB as 3 × 2^20 = 3 145 728 bytes (gives 2155 packets), which the question rules out; or rounding 2054.79 down and forgetting the final packet (gives 2054).

### (c) Transmission time and arrival of the last packet

```text
bits to transmit = 3 082 200 bytes × 8 = 24 657 600 bits
transmission time = 24 657 600 bits ÷ (50 × 10^6 bit/s)
                  = 0.493152 s ≈ 0.493 s

(data only, if headers are left out: 24 000 000 ÷ 50 000 000 = 0.480 s.
 If your friend has 0.48 s, that is the difference. The link really has
 to carry the headers, so I would use 0.493 s and say so.)

time until the last packet arrives = transmission time + one propagation delay
                                   = 0.493152 s + 0.055 s
                                   = 0.548152 s ≈ 0.548 s
```

Reasoning: the first bit leaves at time 0; the last bit leaves the bottleneck link at 0.493 s and then needs one propagation delay of 55 ms to reach Singapore. This assumes the sender never has to stop and wait, which is exactly what (d) takes away.

### (d) A 64 KB window: maximum throughput and time

The sender may have at most W = 65 536 bytes outstanding. After sending a window it must wait for the acknowledgement, and the acknowledgement of the last byte cannot arrive earlier than one RTT after that byte was sent. So at most one window can be delivered per RTT.

```text
W = 65 536 bytes = 65 536 × 8 = 524 288 bits
maximum throughput = W ÷ RTT
                   = 524 288 bits ÷ 0.110 s
                   = 4 766 254.5... bit/s ≈ 4.77 Mbit/s
in bytes:            65 536 ÷ 0.110 = 595 781.8... bytes/s ≈ 0.596 MB/s

time for the file at that rate = 3 000 000 bytes ÷ 595 781.8 bytes/s
                               = 5.035... s ≈ 5.04 s
(same thing counted in windows: 3 000 000 ÷ 65 536 = 45.8, so 46 windows,
 each costing one RTT: 46 × 0.110 s = 5.06 s)

fraction of the link used = 4.77 ÷ 50 = 0.095, about 9.5 %
bandwidth-delay product   = 50 × 10^6 bit/s × 0.110 s = 5 500 000 bits
                          = 687 500 bytes
```

The bandwidth-delay product is the window you would need to keep the link full; 65 536 bytes is 9.5 % of it, which is the same 9.5 % as above. A slightly more careful stop-and-wait model also counts the 10.5 ms it takes to clock each window onto the link (524 288 ÷ 50 000 000 = 0.0105 s): each cycle is then 0.110 + 0.0105 = 0.1205 s, throughput 524 288 ÷ 0.1205 = 4.35 Mbit/s, and the file takes 24 000 000 ÷ 4 351 000 ≈ 5.5 s. If you and your friend got about 5.0 s and about 5.5 s, that is the difference, and either is fine if you state the model. W ÷ RTT is the usual textbook "maximum".

**Is "much longer" fair?** About 5.0 s against 0.548 s from (c) is roughly nine times longer (5.035 ÷ 0.548 = 9.2), so as a statement about the mechanism it is fair: on a long path, throughput is limited by how much data can be in flight per round trip, not by the link speed. Two qualifications you could add: (1) the 64 KB limit comes from the 16-bit window field in the original TCP specification (RFC 793, 1981); the window-scale option (RFC 1323, 1992, now RFC 7323) removed it, so a modern, well-tuned connection can hold the whole 687 500 bytes in flight; (2) even then, real TCP spends one RTT on the connection handshake and several RTTs in slow start before the window is large, and halves its rate on any loss, so a real transfer would still take noticeably longer than the ideal 0.55 s, just not nine times longer. "Longer" is always true; "much longer" is true with an old-style window.

### (e) Why packet switching, with your numbers, and one real event

Circuit switching reserves a fixed share of every link on the path for the whole conversation, whether or not bits are flowing. Packet switching sends self-addressed packets that share links with everyone else's packets.

- **Idle capacity.** In (d) this one sender uses the 50 Mbit/s link only about 9.5 % of the time and spends the other 90 % waiting for acknowledgements. A reserved circuit would waste that 90 %; with packet switching the gaps carry other people's packets, so about ten such transfers could share the one link (this is statistical multiplexing, a standard textbook point). In 1969 the mismatch was far worse than 9.5 %: a person at a terminal types a line and then waits seconds for the time-sharing computer, so a dedicated circuit would be idle almost all the time. That is precisely Davies's 1967 argument for packet switching, and resource sharing between time-sharing machines was ARPANET's stated purpose (Roberts 1978; Abbate 1999).
- **Latency.** The 55 ms propagation delay from (a) is paid either way. Packet switching adds only a small store-and-forward delay per hop, so the sharing costs little in delay. The 110 ms per window in (d) is a cost of the speed of light plus a small window, not of packet switching.
- **Robustness.** This was Baran's reason. Each packet carries its destination address and each node chooses the next hop as it goes, so packets can be routed around a failed link or node, whereas a circuit is lost the moment any link on it fails. The ARPANET IMPs did adaptive routing in this spirit. (Keep the caveat above: ARPANET's funders wanted resource sharing; survivability was Baran's goal and a design benefit, not ARPANET's purpose.)

One real event, with the "failing" side, because it is the best documented: on 27 October 1980 the whole ARPANET stopped working for about four hours. A failing memory in one IMP produced corrupted routing-status updates with contradictory sequence numbers; the routing algorithm kept accepting and re-forwarding them, every IMP flooded every other, and the network had to be brought back by hand. The engineer who wrote it up, Eric Rosen of BBN, published the post-mortem as RFC 789 in 1981. It shows that a design built to survive losing links and nodes could still be taken down by a mistake that the robustness mechanism itself spread.

If you prefer an event where robustness mattered: after the 11 September 2001 attacks, parts of the telephone network in lower Manhattan were out for days, while the Internet re-routed around the damage with only local outages; a 2003 US National Research Council report, *The Internet Under Crisis Conditions: Learning from September 11*, documents this. And an event that links back to (d): in October 1986 the Internet suffered its first congestion collapse; Van Jacobson's 1988 paper *Congestion Avoidance and Control* reports throughput between Lawrence Berkeley Laboratory and the University of California, Berkeley, falling from about 32 kbit/s to about 40 bit/s, and the fix was the slow-start and congestion-avoidance rules that TCP still uses.

## 3. The first ARPANET message

- **When:** the evening of 29 October 1969, at about 22:30 Pacific time. The primary evidence is the handwritten IMP log kept at UCLA, which has an entry at that time recording host-to-host contact with SRI; Kleinrock's own accounts and Hafner and Lyon (1996) both rest on it.
- **Between which computers:** UCLA's SDS Sigma 7 (in Kleinrock's lab, through IMP number 1) and SRI's SDS 940 at Stanford Research Institute in Menlo Park, in Douglas Engelbart's group, through IMP number 2, which had been installed on 1 October 1969. Charley Kline, a UCLA student programmer, typed at UCLA; Bill Duvall watched at SRI, with the two on the telephone (Hafner and Lyon 1996; Kleinrock's accounts).
- **The message:** Kline was trying to log in to the SRI machine by typing "LOGIN". The L and the O arrived; when he typed the G the SRI system crashed. So the first message that actually crossed the network was "LO", and the intended command was "LOGIN", which they completed about an hour later. Both of your versions are therefore right about different things; I would write that the first transmitted message was "LO", the first two letters of "LOGIN", and explain why. (Kleinrock enjoys pointing out that "LO" also reads as "lo and behold".)
- **Why you have seen November:** on 21 November 1969 the UCLA to SRI link became the first permanent ARPANET connection and was demonstrated to ARPA officials, and by 5 December 1969 all four original nodes (UCLA, SRI, UC Santa Barbara, University of Utah) were connected. Some sources date the "start of ARPANET" from one of those; others from the delivery of the first IMP on 30 August 1969. The first message is 29 October.

I am confident of the date, the two machines, the "LO" story and the November milestones. I am slightly less sure of the exact clock time, so write "late in the evening" if you do not want to commit to 22:30.

## Next step

For the essay, give every claim an owner and a verb (proposed, described, analysed, claimed, disputed) and the year, and check each work I named before you cite it: I have recalled them, not opened them. For the calculation, if your friend's numbers still differ after reading (b) to (d), paste both sets and I will find the exact line where you diverge.

Sources: the homework question and the three source claims as pasted in your message (supplied text); course notes on data units and network transfer-time calculations (course notes); Baran, On Distributed Communications Networks, IEEE Transactions on Communications Systems, 1964 (recalled, not consulted); Davies, Bartlett, Scantlebury and Wilkinson, A Digital Communication Network for Computers Giving Rapid Response at Remote Terminals, ACM Symposium on Operating Systems Principles, 1967 (recalled, not consulted); Kleinrock, Communication Nets: Stochastic Message Flow and Delay, 1964 (recalled, not consulted); Roberts, The Evolution of Packet Switching, Proceedings of the IEEE, 1978 (recalled, not consulted); Davies, An Historical Study of the Beginnings of Packet Switching, The Computer Journal, 2001 (recalled, not consulted); Leiner et al., A Brief History of the Internet, Internet Society, 1997 (recalled, not consulted); Abbate, Inventing the Internet, 1999 (recalled, not consulted); Hafner and Lyon, Where Wizards Stay Up Late, 1996 (recalled, not consulted); Isaacson, The Innovators, 2014 (recalled, not consulted); Rosen, RFC 789, Vulnerabilities of Network Control Protocols: An Example, 1981 (recalled, not consulted); Jacobson, Congestion Avoidance and Control, ACM SIGCOMM, 1988 (recalled, not consulted); National Research Council, The Internet Under Crisis Conditions: Learning from September 11, 2003 (recalled, not consulted)
