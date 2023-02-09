# feeder

## get updates from websites

this is started as a project to keep track of movies / concerts / etc happening around me.
given a list of websites and some configuration about their CSS, it can grab a list of events from each website, mash all the lists together, sort them by date, and render them in a very plain list.

this is an extremely rough wip, done while i was watching Repo Man (1984). it's also my foray in Web Components / Lit. please excuse the nightmarish code and terrible build setup.

in the long run, the idea is that it you could configure lists, fields, etc, and it could be used to get updates from any website, for whatever purpose (since RSS has all but disappeared, we're taking matters into our own hands)

build frontend: `yarn rollup -c`
serve backend: `yarn start`

todo:

-   some styling
-   the query to get the list of events takes forever
-   make it configurable
-   build setup
-   fix all the janky date processing
-   load site config from config json, so that you don't have to relaunch the server every time

feature ideas:

-   calendar layout
-   load images
-   filter by type (show / movie / etc)
-   filter by date
-   filter by venue
-   extra fields on a per-site basis
-   caching???
-   a loading spinner
-   pagination
-   fetch event times as well
-   automatically add to calendar
