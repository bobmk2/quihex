## Quivexo

### Intro

```bash
# Install
$ npm install -g quivexo

# Setup
$ quivexo init
$ quivexo ls-notebook
📓 MyBlog
📓 Dialy
📓 ...
$ quivexo config sync-notebook MyBlog

# Sync(Quiver notes => Hexo posts)
$ quivexo sync

# Hexo deploy
$ cd {hexo-dir}
$ hexo deploy

# Fetch posts at blog server
$ ssh myblog.com
[you@myblog]$ cd ~/blog
[you@myblog]$ git fetch && git merge origin/master --ff
```

### License

[MIT](http://opensource.org/licenses/MIT)
