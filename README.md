2D JavaScript Graph Editor
=========

Simple web-based application that allows users to create and edit graphs by adding points and segments <br>
2D infinite canvas with drag and zoom functionality

---
> Functionality:
> - left-click : add point
> - right-click : remove point
> - hold left-click : move point
> - hold right-click : drag canvas
> - scroll wheel : zoom in/out
> - Road World button : open the same graph as a drivable world
---

Road World (`world.html`)
---------
The graph from the editor turned into a small drivable town: segments become two-lane roads, points where 3+ roads meet become roundabouts, and the other points become turns and dead ends.

---
> Functionality:
> - Edit Roads : same mouse controls as the graph editor, drawn as roads
> - Place Cars : left-click a road to add a car in that lane, left-click a car to drive it, right-click a car to remove it
> - W A S D / arrow keys : drive the selected car (Space : brake, Tab : switch car)
> - Generate Scenery : fills the map around and between the roads with a city, suburbs, forest, or a mix (city core with suburbs around it)
> - Follow car : keep the camera on the car you are driving
> - Save : stores the roads, scenery and cars (the graph is shared with the graph editor)
---
<img width="450" alt="Screenshot 2024-01-05 at 2 45 57 AM" src="https://github.com/Samarth-G/GraphEditor-JS/assets/18361189/1f03df1e-a9cc-4242-b254-21ed7dbedd6e">
