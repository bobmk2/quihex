## Quihex [![npm version](https://badge.fury.io/js/quihex.svg)](https://badge.fury.io/js/quihex)

**Quiver** notes => `quihex sync` => **Hexo** posts

1. `Quihex` converts **Quiver** notes written by markdown to **Hexo** blog posts
2. And sync these converted notes to blog posts files

### Motivation

* I'd like to write blog texts at **Quiver** and deploy them easily.

### Dependency

Awesome app and framework :)

* [Quiver](http://happenapps.com/#quiver)
    * Notebook for programmers
    * We are able to write notes with *markdown*
* [Hexo](https://hexo.io/)
    * Blog framework for *markdown*

### Intro

```bash
# Install
$ npm install -g quihex

# Setup
$ quihex init

# Sync(Quiver notes => Hexo posts)
$ quihex sync

# Hexo deploy
$ cd ~/hexo-root
$ hexo deploy

# Fetch posts at blog server
$ ssh myblog.com
[you@myblog]$ cd ~/blog
[you@myblog]$ git fetch && git merge origin/master --ff
```

### Tips

```bash
# Setting tags for sync with quiver notes
#  - sync the note if you set the tag to your notes
# WARNING:
#  - quihex removes tags in tagsForSync from quiver notes when converting notes.
$ vim ~/.quihexrc
# ex)
# ~~~
"tagsForSync": [
  "_sync_",
  "_blog_",
  "_new_tag_" <= Insert
]
# ~~~

# Uninstall
#  - delete module and config file
$ npm uninstall -g quihex
$ rm ~/.quihexrc
```

### TODO

* Setting tags for not sync on cli
* Track changed blog title
    * Now, quihex deals with another posts.
* Handling image files

### License

[MIT](http://opensource.org/licenses/MIT)
