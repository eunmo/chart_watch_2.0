#!/usr/bin/perl
use MP3::Tag;
use MP3::Info;
use POSIX;
use Encode;
use Encode::KR;
use Encode::Guess;
use JSON;
use utf8;
binmode(STDOUT, ":utf8");

my $mp3file = $ARGV[0];

my $mp3 = MP3::Tag->new($mp3file) or die "no file";
$mp3->get_tags;
my $id3v2 = $mp3->{ID3v2};

my $info = get_mp3info($mp3file);

my %tag = parse_tags($mp3, $id3v2, $info);

my $json = to_json \%tag;
print $json;

$mp3->close();

sub remove_feat {
	my $str = shift;

	$str =~ s/\s+\(feat.*?\)//i;
	$str =~ s/\s+\(with.*?\)//i;
	$str =~ s/^Title,\s+//; #don't know why some files are parsed like this

	return $str;
}

sub get_feat {
	my $title = shift;
	my $artist = shift;
	my $feat_str;

	if ($title =~ /\((feat|with)(.*?)\)/i) {
		$feat_str = $2;
	} elsif ($artist =~ /feat(.*?)$/i) {
		$feat_str = $1;
	} else {
		return ();
	}

	$feat_str =~ s/^\.//;
	$feat_str =~ s/^uring//i;

	return get_artist_array($feat_str);
}

sub get_artist_array {
	my $str = shift;

	my @rough_split = split(/[＆&,]/, $str);
	my @arr = ();

	foreach $artist (@rough_split) {
		while ($artist =~ /(.*?) And (.*)/) {
			push(@arr, normalize($1));
			$artist = $2;
		}
		push(@arr, normalize($artist));
	}

	return @arr;
}

sub get_artist {
	my $str = shift;

	$str =~ s/Feat\..*$//;

	return get_artist_array($str);
}

sub parse_tags {
	my $mp3 = shift;
	my $id3v2 = shift;
	my $info = shift;

	my %tag;

	my $title = convert_text($mp3->title());
	my $artist = convert_text($mp3->artist());
	my @artist_arr = get_artist(convert_text($artist));
	my @feat_arr = get_feat($title, $artist);
	my @album_artist_arr = get_artist_array(convert_text($id3v2->get_frame("TPE2")));

	if (!@album_artist_arr) {
		@album_artist_arr = @artist_arr;
	}

	my @norm_artist_arr = normalize_array_for_sort(@artist_arr); 
	my @norm_feat_arr = normalize_array_for_sort(@feat_arr); 
	my @norm_album_artist_arr = normalize_array_for_sort(@album_artist_arr); 

	$tag{"artist"} = \@artist_arr;
	$tag{"feat"} = \@feat_arr;
	$tag{"albumArtist"} = \@album_artist_arr;
	$tag{"artistNorm"} = \@norm_artist_arr;
	$tag{"featNorm"} = \@norm_feat_arr;
	$tag{"albumArtistNorm"} = \@norm_album_artist_arr;

	my $title_wo_feat = normalize(remove_feat($title));

	$tag{"title"} = $title_wo_feat;
	$tag{"titleNorm"} = normalize_for_sort($title_wo_feat);
	
	my $album = normalize(convert_text($mp3->album()));

	$tag{"album"} = $album;
	$tag{"albumNorm"} = normalize_for_sort($album);

	$tag{"track"} = convert_number($mp3->track1()) + 0;
	$tag{"disc"} = convert_number($mp3->disk1()) + 0;

	my $date = convert_number($mp3->year()) + 0;

	if ($date < 10000) {
		$tag{"day"} = 1;
		$tag{"month"} = 0;
		$tag{"year"} = $date;
	} else {
		$tag{"day"} = $date % 100;
		$date = floor($date / 100);
		$tag{"month"} = ($date % 100) - 1;
		$date = floor($date / 100);
		$tag{"year"} = $date;
	}
	
	$tag{"genre"} = normalize(convert_text($mp3->genre()));
	$tag{"time"} = ceil($info->{SECS});
	$tag{"bitrate"} = $info->{BITRATE};

	return %tag;
}

sub convert_number {
	my $num = shift;

	return 0 if (!defined $num || $num eq "");
	return $num;
}

sub convert_text {
	my $text = shift;

	return "" if (!defined $text || $text eq "");

	my $enc = guess_encoding($text, qw/cp949 utf-8/);

	$text = decode($enc->name, $text) unless utf8::is_utf8($text);
	return $text;
}

sub normalize_array_for_sort {
	my @in_arr = @_;
	my @out_arr  = ();

	foreach $str (@in_arr) {
		push(@out_arr, normalize_for_sort($str));
	}

	return @out_arr;
}

sub normalize_for_sort {
	my $str = shift;

	$str =~ s/^a\s+//i;
	$str =~ s/^the\s+//i;

	return $str;
}

sub normalize {
	my $str = shift;

	$str =~ s/^\s+//;
	$str =~ s/\s+$//;
	$str =~ s/[`\"]/\'/g;
	$str =~ s/ :/:/g;

	return $str;
}
