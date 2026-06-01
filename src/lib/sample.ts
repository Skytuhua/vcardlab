// A small, self-contained sample vCard used by the "Load sample" affordance.
// It deliberately includes: a 2.1 quoted-printable card, duplicates (shared email and
// shared phone), mixed types, an address, and a contact needing cleanup — so first-time
// users can see every feature work without supplying their own (private) data.

export const SAMPLE_VCF = `BEGIN:VCARD
VERSION:3.0
FN:Jane Public
N:Public;Jane;Q;;
ORG:Acme Corp;Research
TITLE:Principal Engineer
EMAIL;TYPE=WORK:jane@acme.example
EMAIL;TYPE=HOME:jane.public@home.example
TEL;TYPE=CELL:+1 (555) 010-0100
TEL;TYPE=WORK:+1 (555) 010-0199
ADR;TYPE=HOME:;;123 Main St;Springfield;IL;62704;USA
URL:https://jane.example
BDAY:1986-04-12
CATEGORIES:Friends,Work
NOTE:Met at the 2024 conference.
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Jane Q. Public
EMAIL;TYPE=OTHER:jane@acme.example
TEL;TYPE=CELL:555 010 0100
NICKNAME:JQ
END:VCARD
BEGIN:VCARD
VERSION:2.1
N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Mart=C3=ADnez;Jos=C3=A9;;;
FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Jos=C3=A9 Mart=C3=ADnez
TEL;CELL:+44 7700 900123
EMAIL;INTERNET:jose@example.es
ADR;HOME:;;10 Downing St;London;;SW1A 2AA;UK
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:  Ada  Lovelace
EMAIL:ada@analytical.example
TEL:+1 (555) 222-0001
TITLE:  Mathematician
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Bob Stone
EMAIL:bob@stone.example
TEL;TYPE=CELL:+1 555 333 0007
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Bob Stone
EMAIL:bob.stone@work.example
TEL;TYPE=CELL:+1 (555) 333-0007
ORG:Stoneworks
END:VCARD
`
