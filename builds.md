---
layout: default
title: Builds
permalink: /builds/
---

<h1>{{ page.title }}</h1>

<ul>
  {% for build in site.builds %}
    <li>
      <a href="{{ build.url | relative_url }}">{{ build.title }}</a>
      <small>({{ build.date | date: "%b %-d, %Y" }})</small>
    </li>
  {% endfor %}
</ul>
