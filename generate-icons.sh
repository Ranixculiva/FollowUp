#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p icons

# Generate PNG icons in various sizes
for size in 72 96 128 144 152 192 384 512; do
    rsvg-convert -w $size -h $size icons/icon.svg > icons/icon-${size}x${size}.png
done 