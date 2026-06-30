engine = "pdflatex -interaction=nonstopmode --shell-escape %O %S"
refs = main.bib
output = 'output'

main.pdf:
	@latexmk -pdf -pdflatex=${engine} -output-directory='$(output)' -bibtex main.tex

pack: main.pdf
	rm ../dreamer.tar || true
	cp output/main.bbl main.bbl || true
	tar -czvf ../dreamer.tar --exclude .git --exclude .gitignore --exclude *.log --exclude output .

watch:
	@while ! inotifywait --event modify $(refs) $(sources); do make; done

spell:
	@hunspell -l -t -d en_US -i utf-8 $(sources) \
		| sort \
		| uniq --ignore-case \
		| grep -vxFf dictionary.txt

clean:
	@latexmk -C
	rm -rf $(output)/*
	rm main.bbl || true

.PHONY: watch spell clean
