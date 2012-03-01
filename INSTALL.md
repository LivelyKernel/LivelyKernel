# Lively Kernel installation on Debian / Mac OS X

## Prerequisites

apache2
git
subversion
libapache2-svn

## Installation on Debian
	
1. install prerequisites
	
	sudo apt-get install <package-name> (e.g. apache2)
	
2. checkout Lively Kernel form GitHub (e.g. into /opt)

	cd /opt
	git clone https://github.com/rksm/LivelyKernel.git
	
3. copy Apache config

	sudo cp LivelyKernel/apache_config/lk_ubuntu.conf /etc/apache2/conf.d/
	sudo cp LivelyKernel/apache_config/proxy_rules.conf /etc/apache2/
	
You have to include the proxy_rules in your root config:
	
	sudo edit /etc/apache2/sites-enabled/000-default
	
Insert: "Include proxy_rules.conf" in the Directory directive of your DocumentBase (e.g. /var/www)
	
	######## example #########
	<Directory /var/www>
	    Options Indexes FollowSymLinks MultiViews
	    AllowOverride None
	    Order allow,deny
	    Allow from all
		Include proxy_rules.conf
	</Directory>
	##########################
	
4. create a symbolic link to the destination of the repository (e.g. it is in /opt/LivelyKernel)

	ln -s /opt/LivelyKernel /var/www/lively-kernel
	
5. create a SVN repository for the Wiki (e.g. in /etc/apache2/repos)

	cd /etc/apache2
	mkdir repos && cd repos
	svnadmin create LivelyWiki
	chown -R www-data:www-data LivelyWiki
	
6. add Apache config for Wiki (new file e.g. lk_wiki.conf in /etc/apache2/config.d/)

	sudo cp LivelyKernel/apache_config/lk_wiki.conf /etc/apache2/conf.d/

7. checkout the Wiki repository and copy blank.xhtml in it to be able to start work

	cd /opt
	svn co file:///etc/apache2/repos/LivelyWiki
	cp /opt/LivelyKernel/blank.xhtml /opt/LivelyWiki/
	cd LivelyWiki
	svn add blank.xhtml
	svn ci -m "added blank.xhtml"
	
8. start the server and see if it works (the Wiki can be found at "<yourserver>/wiki")

	sudo /etc/init.d/apache2 start
	(or put restart instead of start if it is already running)
	
9. optionally you can bootstrap the parts from the PartsBin of the webwerkstatt

Right-click to open the WorldMenu.  Go to Tools and click on Workspace.
Copy the following text into the editor pane:

	var  oldRootPath = Config.rootPath        
	try {
	    Config.rootPath = 'http://lively-kernel.org/repository/webwerkstatt/'
	    $world.openPartItem("BootstrapParts", "PartsBin/Tools")        
	} finally {
	    Config.rootPath = oldRootPath        
	}

Hit CTRL-A CTRL-D to executed the code.

!Note! You have to change the URL in the "to:" field of the bootstrap tool to your wiki URL
(e.g. <your_server>/wiki) if URL and repository name are different (as in this tutorial)

## Installation on Mac OS X

Installation on Mac OS X is a little more straight forward.  If any prerequisites are missing you have to install them e.g. with [homebrew](http://mxcl.github.com/homebrew/).

1. checkout Lively Kernel form GitHub (e.g. into /opt)

	cd /opt
	git clone https://github.com/rksm/LivelyKernel.git
	
2. copy Apache config

	sudo cp LivelyKernel/apache_config/lk_osx.conf /etc/apache2/other/
	
3. create a symbolic link to the destination of the repository (e.g. it is in /opt/LivelyKernel)

	ln -s /opt/LivelyKernel /Library/WebServer/Documents/lively-kernel
	
4. create a SVN repository for the Wiki (e.g. in /etc/apache2/repos)

	cd /etc/apache2
	mkdir repos && cd repos
	svnadmin create LivelyWiki
	chown -R www-data:www-data LivelyWiki
	
5. add Apache config for Wiki (new file e.g. lk_wiki.conf in /etc/apache2/config.d/)

	sudo cp LivelyKernel/apache_config/lk_wiki.conf /etc/apache2/other/

6. checkout the Wiki repository and copy blank.xhtml in it to be able to start work

	cd /opt
	svn co file:///etc/apache2/repos/LivelyWiki
	cp /opt/LivelyKernel/blank.xhtml /opt/LivelyWiki/
	cd LivelyWiki
	svn add blank.xhtml
	svn ci -m "added blank.xhtml"
	
7. start the server and see if it works (the Wiki can be found at "<yourserver>/wiki")

	sudo apachectl start
	(or put restart instead of start if it is already running)
	
8. optionally you can bootstrap the parts from the PartsBin of the webwerkstatt

Right-click to open the WorldMenu.  Go to Tools and click on Workspace.
Copy the following text into the editor pane:

	var  oldRootPath = Config.rootPath        
	try {
	    Config.rootPath = 'http://lively-kernel.org/repository/webwerkstatt/'
	    $world.openPartItem("BootstrapParts", "PartsBin/Tools")        
	} finally {
	    Config.rootPath = oldRootPath        
	}
	
Hit CMD-A CMD-D to executed the code.
	
!Note! You have to change the URL in the "to:" field of the bootstrap tool to your wiki URL
(e.g. <your_server>/wiki) if URL and repository name are different (as in this tutorial)