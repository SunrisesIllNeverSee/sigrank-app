# Writing section — author credits and Share removal

Owner requested removal of Share buttons from SigRank, Field, Articles, Blog and Wiki, and personal attribution for original site writing.

Removed UnifiedShare controls from Field Analysis, research, articles index, wiki Four Degrees and blog layout. Removed the embedded Four Degrees PNG/share controls used on SigRank and Wiki. Dedicated social card studio/gallery and non-writing Share controls remain available.

Corrected 13 static blog bylines from “By SigRank” to “By Deric J. McHenry.” Normalized the four original Markdown frontmatter author fields to Deric J. McHenry. Existing personAuthor structured metadata already uses that identity and is preserved. Shared editorial pages now display a visible author/publisher credit: Written by Deric J. McHenry; Published by SignalAF · SigRank. Quoted material, source citations, original text, dates and research authors were not rewritten.

Browser checked SigRank, Field Hub, Field Analysis, Articles, Blog, Wiki, wiki Four Degrees and a static blog detail. No Share buttons found; author credit present (Field streaming shell confirmed in a second completed DOM snapshot). Old “By SigRank” absent. TypeScript clean; canonical 11/11; scoped lint zero errors, 12 existing warnings in Field images/unused values and the Markdown image renderer. git diff whitespace clean.

Stage only: localhost:3230. No production deploy.
