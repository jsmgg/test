从master分支新建一个分支：git checkout -b 763 origin/master --no-track
第一次提交分支：git push --set-upstream origin 763

git checkout -b 759 origin/759   // 第一次切换分支这样搞
git checkout 759  // 第二次切换分支这样搞
merge代码：在当前分支下执行 git merge origin/hzm768;  把hzm768分支代码合到当前分支
git reset HEAD~1  回退到前一次提交，然后checkout 就能还原了


position:-webkit-sticky
-webkit-overflow-scrolling:touch;
