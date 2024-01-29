return '''
# Interactive 3D Helix Dashboard

This interactive dashboard allows the user to create and visualize a 3D helix with customizable parameters. 

There are three sliders that allow the user to adjust the following parameters of the helix:

- **Radius**: This slider adjusts the radius of the helix. The radius can be any real number between 0.1 and 10. The default value is 1.
- **Frequency**: This slider adjusts the frequency of the helix. The frequency can be any real number between 0.1 and 10. The default value is 1.
- **Rotations**: This slider adjusts the number of rotations in the helix. The number of rotations can be any integer between 1 and 10. The default value is 5.

The plot itself is a 3D scatter plot, where the x, y, and z coordinates of the points are defined by the parametric equations of the helix. The line of the helix is colored according to a color scale that is mapped to the parameter 't' of the parametric equations, resulting in a gradient effect along the helix.
'''
