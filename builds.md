---
layout: home
title: Builds
permalink: /builds/
---

<h1>Builds</h1>

<ul>
  {% for post in site.posts %}
    {% if post.tags contains "builds" %}
      <li>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <small>({{ post.date | date: "%b %-d, %Y" }})</small>
      </li>
    {% endif %}
  {% endfor %}
</ul>
