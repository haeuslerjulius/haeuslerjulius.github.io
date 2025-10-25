---
layout: default
title: Builds
---

<h1>{{ page.title }}</h1>

<ul>
  {% for build in site.builds %}
    <li>
      <a href="{{ build.url | relative_url }}">{{ build.title }}</a><br>
      <small>{{ build.date | date: "%B %d, %Y" }}</small><br>
      {{ build.description | default: build.excerpt }}
    </li>
  {% endfor %}
</ul>
