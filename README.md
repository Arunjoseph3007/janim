# janim

An attempt to understan how animation engines like [manim](https://github.com/3b1b/manim) work. Also inspired by tsoding daily's [panim](https://github.com/tsoding/panim)

## Todo

- [ ] Binary Ops - (Union, Intersection, Difference, Exclusion)
- [ ] Common Winding - figure out a mechanism such that all contours wll have the same winding


## Reference

- [Bezier Subdivision](https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/Bezier/bezier-sub.html)
- [GXWeb](https://geometryexpressions.com/gxweb/) - Useful tool for plotting
- [MY Model](https://geometryexpressions.com/gxweb/?view=0c8f86aa93e14e25a6f08174fa64a6d5)
- [javascript Clipper SO Answer](https://stackoverflow.com/a/20816220)
- [jsClipper](https://github.com/mathisonian/JsClipper)
- [Bala Vatti Clipping Algorithm](https://dl.acm.org/doi/pdf/10.1145/129902.129906)
  - This ia a very accurate and somewhat complicated algorithm. It handles all cases like self intersecting polygons, holes, etc. I havent looked into it enough to understand it and hence, havent implemented it yet. For time being we are using a custom algorithm. Allthough I didnt knew about it at the time, and came up with this independently, my algorithm is very similar to the famous [Weiler-Atherton clipping Algorithm](https://en.wikipedia.org/wiki/Weiler%E2%80%93Atherton_clipping_algorithm) 
- [Bezier Clipping](http://nishitalab.org/user/nis/cdrom/cad/CAGD90Curve.pdf)
