structure:
the way it works at least the last time i looked at the files, render is able to take latex and render it
it is also supposed to take the curser location and highlight of the latex, and highlight the corresponding location in the rendering
aka, if you highlight upper bounds in latex, it should highlight only the upper bounds region
if you highlight upper and lower bounds, it should ignore the function itself, and just highlight the upper and lower bounds in the region
test is a script used as a plug in inside of the larger js script to make temporary edits
then finally, to run and see any changes you must run one of the htmls

goal:
the goal is to make it such that curser rending behaves correctly, aka highlighting function highlights function, bounds highlights bounds, etc
and make it such that when you click on a region in the render, it lets you edit is like you can in mathway
mathway doesnt use latex, they use some third language, potentially the one Microsoft uses.

general guidence:
for this project firstly, put serve and index in the same folder. 
make a subfolder, then put everything else in the subfolder
llms cant handle writing the full script. you have to create a system prompt that says something like: only give me exact lines to copy and their replacements, or else every edit you make it will delete portions and screw them

i am not sure if sonet is able to handle it, i think opus .6 will work but .7 is a bit buggy, not sure about opus .5 but people have said it is good
