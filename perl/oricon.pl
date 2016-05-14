use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use File::Slurp 'slurp';
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $yy = $ARGV[0];
my $mm = $ARGV[1];
my $dd = $ARGV[2];
my $count = 4;

my $od = DateTime->new( year => $yy, month => $mm, day => $dd );
my $ld = DateTime->new( year => $yy, month => $mm, day => $dd )
								 ->truncate( to => 'week' )
								 ->add( weeks => 2);
my $od_ymd = $od->ymd('');
my $ld_ymd = $ld->ymd('');

if ($od_ymd == '20000101' ||
	  $od_ymd == '20001230' ||
	  $od_ymd == '20011229' ||
	  $od_ymd == '20021228' ||
	  $od_ymd == '20031227' ||
	  $od_ymd == '20050101' ||
	  $od_ymd == '20051231' ||
	  $od_ymd == '20061230' ||
	  $od_ymd == '20071229' ||
	  $od_ymd == '20081227' ||
	  $od_ymd == '20100102') {
	print "[]";
	exit;
}

$count = 1 if $od_ymd < '20031122';

my $you_date = $ld->ymd(' ');

my $perl_dir = "/Users/eunmo/dev/chart_watch_2.0/perl";
chdir $perl_dir;

system "/bin/bash you.sh $you_date $count";
my $html_dir = "$perl_dir/html";

my $rank = 1;

print "[";

for (my $i = 1; $i <= $count; $i++) {

	my $dom = Mojo::DOM->new(scalar slurp "$html_dir/$ld_ymd-$i.html");
	my $odd = 1;
	my $artist, $title;
	
	for my $a ($dom->find('table[bgcolor="#C1C1C1"]')->first->find('a')->each) {
		if ($odd % 2) {
			$title = normalize_title(get_text($a->text));
		} else {
			$artist = normalize_artist(get_text($a->text));
			print ",\n" if $rank > 1;
			print "{ \"rank\": $rank, \"artist\": \"$artist\", \"title\" : \"$title\" }";
			$rank++;
		}
		$odd++;
	}
}

print "]";

system "rm $html_dir/$ld_ymd*";

sub get_text($)
{
	my $s = shift;

	$s = decode('shiftjis', $s);

	$s =~ tr/　！＂＃＄％＆＇（）＊＋，－．／/ !"#$%&'()*+,-.\//;
	$s =~ tr/０-９：；＜＝＞？＠Ａ-Ｚ［＼］＾/0-9:;<=>?@A-Z[\\]^/;
	$s =~ tr/＿｀ａ-ｚ｛｜｝￠￡￢￣￤￥￦/_`a-z{|}\¢£¬¯¦¥₩/;
	$s =~ tr/−/-/;

	return $s;
}

sub normalize_title($)
{
	my $string = shift;

	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;
	$string =~ s/\\/¥/g;

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;

	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;

	return $string;
}
