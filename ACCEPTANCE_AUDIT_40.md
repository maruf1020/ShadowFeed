# ShadowFeed 40-Point Acceptance Audit

1. Completed: replaced the old theme runtime path with a local theme provider.
2. Completed: fixed the remaining theme-toggle hydration mismatch.
3. Completed: added a light/dark theme toggle component.
4. Completed: wired the theme toggle into the public landing page.
5. Completed: wired the theme toggle into the auth shell pages.
6. Completed: wired the theme toggle into the protected app shell.
7. Completed: added pointer cursor styling to the shared button primitive.
8. Completed: added global pointer cursor rules for links, labels, inputs, and selects.
9. Completed: changed the default feed ordering to latest activity.
10. Completed: preserved the newest-post sorting mode.
11. Completed: preserved the trending sorting mode.
12. Completed: added the most-discussed sorting mode.
13. Completed: search now matches post titles.
14. Completed: search now matches post body content.
15. Completed: search now matches post excerpts.
16. Completed: search now matches tags.
17. Completed: search now matches poll questions and options.
18. Completed: search now matches comment content.
19. Completed: added the feed top control toolbar.
20. Completed: placed current user info in the feed toolbar.
21. Completed: placed logout controls in the feed toolbar.
22. Completed: placed global feed search in the feed toolbar.
23. Completed: placed feed sort selection in the feed toolbar.
24. Completed: preserved search and filter state across feed links.
25. Completed: added a clear-filters action.
26. Completed: surfaced active search and filter badges.
27. Completed: documented seeded member and admin profiles in `.env.example`.
28. Completed: fixed the original `comment.replies` runtime crash.
29. Completed: enforced the nested reply depth limit in the UI.
30. Completed: enforced the nested reply depth limit in the server action.
31. Completed: made the comment renderer tolerant of missing nested reply arrays.
32. Completed: validated landing-page runtime behavior.
33. Completed: validated auth-shell runtime behavior.
34. Completed: validated protected feed runtime behavior.
35. Completed: validated end-to-end feed search behavior.
36. Completed: validated latest-activity ordering against live feed mutations.
37. Completed: reduced feed mutation flicker with optimistic reaction, comment, and poll updates.
38. Completed: tightened feed labels and status copy around sorting, search, and recovery prompts.
39. Completed: rechecked clickable surfaces for pointer cursor consistency in the main UI.
40. Completed: passed `npm run typecheck`, `npm run lint`, `npm run build`, and live browser verification.