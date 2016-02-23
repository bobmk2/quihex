## Quihex

Quiver notes => (*quihex sync*) => Hexo posts

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
# Setting tags for not sync
$ vim ~/.quihexrc
# ex)
# ~~~
"tagsForNotSync": [
  "hide",
  "wip",
  "secret",
  "newtag" <= Insert
]
# ~~~

# Uninstall
# delete module and config file
$ npm uninstall -g quihex
$ rm ~/.quihexrc
```

### TODO
* Setting tags for not sync on cli

### License

[MIT](http://opensource.org/licenses/MIT)
