# sliver

Sliver is a lightweight JavaScript framework.

# How to use it

See the [sample-apps directory](sample-apps).

Hosted `sample-apps/app1`: [https://johnkerl.org/sliver/sample-apps/app1](https://johnkerl.org/sliver/sample-apps/app1/index.html)

Used by the `jsbee` app: [https://johnkerl.org/jsbee](https://johnkerl.org/jsbee/index.html)

# Why

JavaScript frameworks such as React are full-featured, rich, and powerful. And I wouldn't think of doing complex web development without one of them.

On the other hand, for simple projects, I find such frameworks to be too much. As I write this (2024), the underlying browser model is mature and well-documented, as are ES6, HTML, and CSS. You can do a lot of things with only these. Moreover, they're _single_ and they're _stable_. _Single_ in the sense there one standard for ES6, for HTML, for CSS; _stable_ in the sense that changes happen by committee, and are phased over years.

By contrast, JavaScript frameworks are _multiple_ and _ever-changing_. _Multiple_ in the sense that knowing React deeply may offer only general help in learning Angular or Vue.js, and vice versa: these frameworks solve similar problems, but in different ways. _Ever-changing_ in the sense that a new framework version may require app-level changes.

As well, JavaScript frameworks are often _complete_ and _opaque_ in the sense that they successfully hide much or all of the browser API. When I was doing full-time React development in the 2018-2020 timeframe, while I got quite comfortable with React, I later realized I didn't know much at all about how to do web development _without_ React. This is a separate learning.

Last is packaging: while `npm` and `yarn` are powerful tools, for simple use-cases it suffices to point at a URL with a `.js` file in it.

Given those concerns, for small-scale web development, one might simply use no framework at all, sticking with HTML, CSS, and ES6. An examples of this is [pangram-checker](https://github.com/johnkerl/pangram-checker).

But sometimes one wants _some_ application state, _some_ encapsulation, _some_ component reuse. For [jsbee](https://github.com/johnkerl/jsbee) I wanted some reusable classes between my application and the browser API --- a mere thin sliver of logic, decorating the browser API rather than hiding it. Thus Sliver was born.

# Status

This was just a fun little holiday lark at the end of 2024.

# Future work

* Allow more CSS props in widgets, e.g. button colors
* More assertions
