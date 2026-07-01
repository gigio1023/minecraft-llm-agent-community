#!/usr/bin/env python3
"""Compact HF papers search output: id, year-month, truncated title.

Reads the TSV that `hf papers search` writes on stdout and prints one
short line per result so many queries can be scanned quickly.
"""
import sys
import csv

reader = csv.DictReader(sys.stdin, delimiter="\t")
for row in reader:
    pid = row.get("id", "?")
    pub = row.get("published_at", "")[:7]
    title = (row.get("title", "") or "")[:88]
    print("{:14} {:8} {}".format(pid, pub, title))
