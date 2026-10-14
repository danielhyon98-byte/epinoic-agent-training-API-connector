Short version first. Your teacher's three notes each point at a real problem in Source A:

- **"trace it"**: the line `loop J from 0 to N-1-I` reads one element past the end of the array on every pass, and `if A[J] > A[J+1] then` sorts **ascending**, while Source A says the leaderboard "must show players in descending order of score".
- **"check your maths"**: your own Table 3 shows the time multiplying by about **4** each time n doubles, not "a bit faster than double". That is the signature of O(n²), not O(n log n), and the 100 000-player extrapolation comes out at roughly **9 minutes**, not "well under a second".
- **"source?"**: the Knuth sentence is wrong on the date, the attribution and the purpose.

Everything below was traced and calculated by hand from the text you pasted. I can't run code here, so I haven't run your Python and I can't re-run your timings. I'm not rewriting the section; each point tells you which line or sentence to look at and why.

Assumptions I've made: IB-style pseudocode, where `loop J from 0 to N-1-I` includes both end values; `=` assigns in a statement and compares inside `if`; `break` leaves the outer loop; and the array is "indexed 0 to N-1", as your comment says.

## 1. Trace of SORT on A = [7, 3, 9, 1, 5], N = 5

### Problem 1 (runtime error): the inner loop reads past the end of the array

On the first pass I = 0, the line `loop J from 0 to N-1-I` gives J = 0, 1, 2, 3, 4. At J = 4 the test `if A[J] > A[J+1]` reads A[5]. The array has positions 0 to 4 only, so A[5] does not exist. In pseudocode that is undefined; a literal Python translation would stop with an index error on the first pass. (That also tells you the Python you timed cannot be a literal copy of this pseudocode; see claim 12 in part 3.)

The principle: the last J used must keep J + 1 inside the array, so J + 1 <= N - 1, so the last J is N - 2. With I values already in their final place at the right-hand end, the last J is **N - 2 - I**. That is the one token to change on that line, nothing else.

My guess at the cause: Python's `range(0, N - 1 - I)` stops *before* N - 1 - I, but the pseudocode's `to` *includes* it, so a correct Python loop became an off-by-one pseudocode loop in translation. Check your Python to confirm.

### The trace with that one bound corrected (last J = N - 2 - I)

Each row is one comparison, in execution order. "Swap?" counts the swaps so far.

| Pass (I) | J | A[J] | A[J+1] | A[J] > A[J+1]? | Swap? | Array after this step |
| --- | --- | --- | --- | --- | --- | --- |
| 1 (I = 0) | 0 | 7 | 3 | True | yes (1) | [3, 7, 9, 1, 5] |
| 1 (I = 0) | 1 | 7 | 9 | False | no | [3, 7, 9, 1, 5] |
| 1 (I = 0) | 2 | 9 | 1 | True | yes (2) | [3, 7, 1, 9, 5] |
| 1 (I = 0) | 3 | 9 | 5 | True | yes (3) | [3, 7, 1, 5, 9] |
| 2 (I = 1) | 0 | 3 | 7 | False | no | [3, 7, 1, 5, 9] |
| 2 (I = 1) | 1 | 7 | 1 | True | yes (4) | [3, 1, 7, 5, 9] |
| 2 (I = 1) | 2 | 7 | 5 | True | yes (5) | [3, 1, 5, 7, 9] |
| 3 (I = 2) | 0 | 3 | 1 | True | yes (6) | [1, 3, 5, 7, 9] |
| 3 (I = 2) | 1 | 3 | 5 | False | no | [1, 3, 5, 7, 9] |
| 4 (I = 3) | 0 | 1 | 3 | False | no | [1, 3, 5, 7, 9] |

Array after every pass of the outer loop:

| Pass (I) | J runs | Comparisons | Swaps | Array after the pass | SWAPPED at end of pass |
| --- | --- | --- | --- | --- | --- |
| 1 (I = 0) | 0 to 3 | 4 | 3 | [3, 7, 1, 5, 9] | true |
| 2 (I = 1) | 0 to 2 | 3 | 2 | [3, 1, 5, 7, 9] | true |
| 3 (I = 2) | 0 to 1 | 2 | 1 | [1, 3, 5, 7, 9] | true |
| 4 (I = 3) | 0 to 0 | 1 | 0 | [1, 3, 5, 7, 9] | false, so `break` |

Totals: **10 comparisons, 6 swaps, 4 passes**; pass 5 (I = 4) never runs because of the early exit. Final array [1, 3, 5, 7, 9].

Two checks you can repeat: 4 + 3 + 2 + 1 = 10 comparisons, which is the full N(N - 1)/2 = 5 × 4 / 2 = 10 because the early exit only saved the empty fifth pass; and the number of swaps in a bubble sort always equals the number of out-of-order pairs in the starting array, which for [7, 3, 9, 1, 5] are (7,3), (7,1), (7,5), (3,1), (9,1), (9,5): six pairs, six swaps.

As written (bound N - 1 - I), pass 1 would do the same first four comparisons and then a fifth, J = 4, comparing A[4] = 5 with the non-existent A[5]. The trace cannot continue past that point, which is what "trace it" was getting at.

### Problem 2 (logic error against your requirement): it sorts the wrong way

The corrected trace produces [1, 3, 5, 7, 9], ascending. Source A's first sentence says the leaderboard "must show players in descending order of score". The line to look at is `if A[J] > A[J+1] then`: it swaps when the left value is bigger, so bigger values drift right. For descending order the swap must happen when the left value is *smaller*, which is a one-character change to the comparison operator. If your Python actually gets descending order another way (reversing afterwards, or sorting on negated scores), the write-up has to say so and the pseudocode has to match.

Everything else in SORT is correct: the three-line swap through TEMP is right, SWAPPED is reset at the start of each pass and set only when a swap happens, and the exit test works (pass 4 above shows it).

Two minor notation points, not bugs: the outer loop `loop I from 0 to N-1` allows N passes where N - 1 is enough (the last pass has nothing left to compare; with the flag it ends earlier anyway). And I'm not certain `break` is in the pseudocode notation your course uses; if your teacher's notation sheet doesn't list it, an outer `loop while` that tests SWAPPED expresses the same early stop. Check the sheet.

Try it: re-trace [7, 3, 9, 1, 5] with the comparison flipped for descending order. You should finish at [9, 7, 5, 3, 1]; I make it 9 comparisons, 4 swaps and 3 passes. If you get something different, we can compare rows.

## 2. Your complexity claim against Table 3

### What the data actually says

Source A: "When n doubles the time grows a bit faster than double, which is consistent with O(n log n)." Here are the ratios, by hand:

| n | time (s) | time ÷ previous time | time ÷ n² (s) |
| --- | --- | --- | --- |
| 1 000 | 0.052 | – | 0.052 / 1 000 000 = 5.2 × 10⁻⁸ |
| 2 000 | 0.21 | 0.21 / 0.052 = 4.04 | 0.21 / 4 000 000 = 5.25 × 10⁻⁸ |
| 4 000 | 0.85 | 0.85 / 0.21 = 4.05 | 0.85 / 16 000 000 = 5.31 × 10⁻⁸ |
| 8 000 | 3.4 | 3.4 / 0.85 = 4.00 | 3.4 / 64 000 000 = 5.31 × 10⁻⁸ |

(Ratios rounded to 2 decimal places; 0.052 × 4.04 = 0.21008 and 0.21 × 4.05 = 0.8505 as a check.)

What each model predicts when n doubles:

- O(n): time × 2.
- O(n log n): time × 2 × log₂(2n) / log₂(n). From 1 000 to 2 000 that is 2 × 10.97 / 9.97 = 2.20; from 4 000 to 8 000 it is 2 × 12.97 / 11.97 = 2.17.
- O(n²): time × 2² = 4.

Your ratios are 4.04, 4.05 and 4.00, and time ÷ n² is nearly constant (5.2 to 5.3 × 10⁻⁸ s). So the data says **quadratic**, cleanly. "A bit faster than double" is a misreading of your own table: four times is a lot faster than double. The O(n log n) claim is contradicted, not supported, by Table 3.

A plausibility check that the timings are the real quadratic bubble sort: without early exit, bubble sort does n(n - 1)/2 comparisons, which for n = 8 000 is 8 000 × 7 999 / 2 = 31 996 000. 3.4 s / 31 996 000 ≈ 1.06 × 10⁻⁷ s, about 0.1 microseconds per comparison, and n = 1 000 gives 0.052 / 499 500 ≈ 1.04 × 10⁻⁷ s. The same cost per comparison at both sizes is what you expect from an interpreted Python loop doing the full quadratic number of comparisons on random data.

### The 100 000-player extrapolation

Using the quadratic fit and your largest measurement, on the same machine and with random data:

```text
n ratio      = 100 000 / 8 000 = 12.5
time ratio   = 12.5² = 156.25
time         = 3.4 s × 156.25 = 531.25 s
            ≈ 530 s (2 significant figures) ≈ 8.9 minutes
```

Using the constant from the smallest row instead (5.2 × 10⁻⁸ × 100 000² = 520 s) gives much the same. So the honest estimate is **about 9 minutes**, roughly 500 times longer than "well under a second".

Note that no model fits "well under a second" even if your analysis had been right: a linear model gives 3.4 × 12.5 = 42.5 s, and your own O(n log n) model gives 3.4 × (100 000 × 16.61) / (8 000 × 12.97) ≈ 3.4 × 16.0 ≈ 54 s. The conclusion was never derived from the table; the "check your maths" note is about this sentence as much as the ratios.

### Is "O(n) for nearly sorted data" correct?

Partly. Here is the precise version:

- **Already sorted**: one pass of N - 1 comparisons, no swaps, SWAPPED stays false, exit. That is O(n), and it is the only case where "O(n)" is simply true.
- **"Nearly sorted"** is not a precise term, and bubble sort treats the two directions very differently. A pass moves a value *with* the sweep direction as far as it needs to go in one pass, but moves a value *against* the sweep direction only **one place per pass**.

Take your own scenario, "only one score changes at a time", on a descending leaderboard with the comparison flipped so that small scores drift right. Two hand traces with N = 5:

| Case | Start | After pass 1 | After pass 2 | After pass 3 | After pass 4 | Comparisons |
| --- | --- | --- | --- | --- | --- | --- |
| Top player's score **falls** to 2 | [2, 7, 5, 3, 1] | [7, 5, 3, 2, 1] (3 swaps) | no swaps, exit | – | – | 4 + 3 = 7 |
| Bottom player's score **rises** to 10 | [9, 7, 5, 3, 10] | [9, 7, 5, 10, 3] | [9, 7, 10, 5, 3] | [9, 10, 7, 5, 3] | [10, 9, 7, 5, 3] | 4 + 3 + 2 + 1 = 10 |

A falling score is fixed in two passes, about 2n comparisons, so O(n). A rising score that has to climb k places needs about k passes of up to n comparisons each, so O(kn); if k can be as large as the list, that is O(n²), and in the second trace a single changed score cost the full 10 comparisons, exactly the same as sorting a random list of 5. Since scores on a leaderboard mostly go up, the common case is the expensive direction. At 100 000 players, one pass is about 100 000 comparisons × 0.1 microseconds ≈ 0.01 s, so a falling score costs about 0.02 s, a climb of 1 000 places about 10 s, and a climb from near the bottom about the same as a random sort, roughly 9 minutes.

So the sentence should say "O(n) when the data is already sorted or when the changed score moves down the table; O(kn) when a score rises k places". Two things worth knowing for your justification (you decide what to do with them): a standard textbook result is that insertion sort runs in O(n + number of out-of-order pairs), so it handles one changed score in O(n) in *either* direction; and if only one score changes at a time, you don't need a full sort at all, because removing that player and re-inserting them at the right position is a single O(n) operation.

## 3. Every claim in Source A

| # | Claim (quoted from Source A) | Verdict | Why |
| --- | --- | --- | --- |
| 1 | "The leaderboard screen must show players in descending order of score." | Justified as a requirement, if it appears in your requirements section | But the algorithm underneath sorts ascending (part 1). |
| 2 | "I decided to write my own sorting algorithm … so that I could demonstrate my understanding of algorithms." | Justified as a stated design reason | An honest reason. It must then be backed by a correct algorithm and analysis, which is what the rest of the section is for. |
| 3 | "Bubble sort is the fastest algorithm for small lists" | Wrong, and unsupported | No standard result says this. Insertion sort is the usual choice for small lists; the standard analysis gives it about half the comparisons of bubble sort on average, with the same number of swaps. No source is given. |
| 4 | "real programming languages use it inside their built-in sort functions" | Wrong | Python uses Timsort (merge sort plus insertion sort); Java uses dual-pivot quicksort for primitive arrays and TimSort for objects; C++ library sorts are commonly introsort. None uses bubble sort; the small-list helper they do use is insertion sort. Details and confidence below. |
| 5 | "so there is no loss of performance" | Wrong | Follows from a false premise. The built-in sort is O(n log n) and runs in compiled code; yours is O(n²) in interpreted Python (your Table 3). Time `sorted()` on the same lists and the difference will be in your data. |
| 6 | The SORT pseudocode | Wrong as written | Reads past the end of the array; sorts ascending not descending (part 1). |
| 7 | "Because of the SWAPPED flag the algorithm stops early" | Justified | Pass 4 of the trace shows the exit; correct once the bound is fixed. |
| 8 | "O(n) for nearly sorted data" | Partly right | True for already-sorted data and for a falling score; O(kn) for a score rising k places (part 2). |
| 9 | "(which the leaderboard usually is, since only one score changes at a time)" | Unsupported | An assumption about how your app updates scores; link it to your requirements. It also ignores the first build of the list (loading saved scores is not sorted) and, as shown, the one-change case can be the slow case. |
| 10 | "O(n log n) on average" | Wrong | Standard textbook result: bubble sort averages about n²/2 comparisons and n(n - 1)/4 swaps, so O(n²) on average; your own table confirms × 4 per doubling. |
| 11 | "Big O notation was invented by Donald Knuth in 1976 specifically for comparing sorting algorithms." | Wrong on all three parts | See the note below. |
| 12 | "tested SORT on random lists of scores in Python (average of three runs)" | Unsupported as written | The method is under-described: which Python code (it cannot be a literal copy of the pseudocode, see part 1), machine, Python version, timer used, score range, whether the same lists were reused. The table is good evidence; the method needs to be visible so a reader can repeat it. |
| 13 | "When n doubles the time grows a bit faster than double" | Wrong | Ratios are 4.04, 4.05, 4.00 (part 2). |
| 14 | "which is consistent with O(n log n)" | Wrong | × 4 per doubling is O(n²); O(n log n) would give about × 2.2. |
| 15 | "the school's planned 100 000-player leaderboard would sort in well under a second" | Wrong | About 530 s on the quadratic fit; 54 s even on your n log n model; 42.5 s even on a linear model (part 2). |
| 16 | "so the algorithm is suitable" | Unsupported, and contradicted by your own data for random lists | A justified conclusion needs the corrected analysis, a measurement of the realistic case (one changed score, up and down), and a comparison row for the built-in sort. It may still be defensible for a class-sized list; it is not for 100 000 random scores. |

### The Knuth sentence, with how sure I am

- Big O notation was introduced by the mathematician Paul Bachmann in 1894, in his book Analytische Zahlentheorie, and was popularised by Edmund Landau from 1909 in number theory, which is why the O, o symbols are sometimes called Landau symbols. I'm confident of this; it is the standard account in textbooks and in Knuth's own historical notes.
- Donald Knuth did not invent it. He popularised it in computer science through The Art of Computer Programming (first volume 1968), and in 1976 he published a short article in SIGACT News, which I recall as "Big Omicron and big Omega and big Theta", proposing the now-standard meanings of Ω and Θ alongside O. I'm confident the 1976 note exists and that it is about Ω and Θ rather than inventing O; I'm fairly, not fully, confident of its exact title. That 1976 note is probably where your date came from.
- It was not invented "specifically for comparing sorting algorithms"; it came from number theory and describes the growth of any function.
- One thing Knuth did write about bubble sort, which cuts against claim 3: in The Art of Computer Programming, Volume 3 (Sorting and Searching, first edition 1973), his conclusion on bubble sort is, in paraphrase, that it has little to recommend it beyond a memorable name and some interesting theoretical problems. I'm confident of the substance and roughly of the wording; I have not opened the book in this session, so check the exact words before quoting them.

For a development write-up, the safest move is to delete the history sentence (it adds nothing to the justification) or, if you keep it, to state only what you have read yourself and cite that source in your school's referencing style.

### The built-in sorts, with how sure I am

- Python's list sort and `sorted()` use Timsort, a hybrid of merge sort and binary insertion sort written by Tim Peters in 2002 and used by CPython since Python 2.3. It is described in a text file called listsort.txt in the CPython source. High confidence; this is the language of your project, so it is the one that matters.
- Java's Arrays.sort uses dual-pivot quicksort for arrays of primitive types and TimSort for arrays of objects (since Java 7). High confidence; the Java API documentation for Arrays.sort states the algorithms.
- C++ standard-library sort in the common implementations is introsort (quicksort with a heapsort fallback and insertion sort for short ranges). Fairly confident.
- I am not aware of any mainstream language whose standard sort uses bubble sort, and the small-list helper in all three above is insertion sort, not bubble sort.

Where I cannot help: I can't verify a citation for you without tools, so whatever you cite, read it yourself and cite the edition you read.

## 4. Provisional mark against your Development criterion

I haven't seen your rubric's descriptors, and the IB has a new Computer Science guide, so I can't tell whether your 12-mark Development criterion matches the version I know. Also, a criterion is applied to the whole Development section, not to one extract, so treat this as: if the rest of the section looked like this extract, where would it land? Paste the descriptors and I'll re-mark against them.

Provisional mark on an illustrative scheme, not your rubric and not the official IB criteria: 4 out of 12 if the whole Development criterion were judged on this extract alone; only your teacher and the IB award real marks.

What earns that: a technique is identified and presented in pseudocode; the early-exit mechanism is explained correctly; you ran a timing experiment with a sensible doubling design and reported the numbers honestly; and the design decision is stated with a genuine reason (demonstrating algorithmic understanding).

What loses the rest: the algorithm does not run as written and sorts in the wrong direction; the complexity analysis is wrong (average case, and the reading of your own data); the extrapolation contradicts the data; and three factual claims (fastest for small lists, used by real languages, invented by Knuth in 1976) are wrong and unsourced, which is exactly what "source?" is flagging.

What would move it up, in your own words:

1. Fix the two lines in part 1, make the pseudocode match the Python you actually timed, and include a short hand trace like the one above (a 5-element example is fine) so a reader can see it works.
2. Replace the complexity paragraph with a correct one: O(n²) average and worst case; O(n) only when already sorted; the rising-versus-falling score behaviour for your one-change case.
3. Read your own table correctly: show the × 4 ratios and say what they mean.
4. Add two measurements that are missing: `sorted()` on the same random lists as a control, and your sort on a sorted 100 000-score list with one score moved up and one moved down. Describe the method (code used, timer, machine, number of runs) so it is repeatable.
5. Redo the 100 000-player extrapolation with the working shown, and write a conclusion that follows from it. "Suitable for the class-sized leaderboard; not suitable for 100 000 random scores, so for the planned size I would use the built-in sort or insert each changed score in place" is the kind of honest, evidence-based conclusion that scores well; a cheerful but unsupported "suitable" does not.
6. Cut or correct the history sentence, and cite only sources you have read.

One concrete next step: before you touch the write-up, time `sorted()` on your four random lists and your sort on a sorted 8 000-score list with the bottom score raised to the top. Those two rows will tell you more about whether your choice is justified than anything I've written here, and they are your own evidence.

Sources: Source A, your IA development write-up extract section 3.2 including the SORT pseudocode and Table 3 (supplied text); course notes on sorting, Big O notation and hand tracing (course notes); Knuth, The Art of Computer Programming, Volume 3: Sorting and Searching (1973) (recalled, not consulted); Knuth, Big Omicron and big Omega and big Theta, SIGACT News (1976) (recalled, not consulted); Bachmann, Analytische Zahlentheorie (1894) (recalled, not consulted); Landau, Handbuch der Lehre von der Verteilung der Primzahlen (1909) (recalled, not consulted); Tim Peters, listsort.txt in the CPython source describing Timsort (2002) (recalled, not consulted); Java API documentation for Arrays.sort (recalled, not consulted)
