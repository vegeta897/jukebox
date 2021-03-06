<?php
 	require_once("rest.inc.php");
    require_once("db.class.php");
	
	class API extends REST {
	
		public $data = "";
		
		private $mysqli = NULL;
		public function __construct(){
			parent::__construct();				// Init parent constructor
			$this->dbConnect();					// Initiate Database connection
		}
		
		/*
		 *  Connect to Database
		*/
		private function dbConnect(){
			$this->mysqli = new mysqli(DB::DB_SERVER, DB::DB_USER, DB::DB_PASSWORD, DB::DB_NAME);
		}
		
		/*
		 * Dynamically call the method based on the query string
		 */
		public function processApi(){
			$func = strtolower(trim(str_replace("/","",$_REQUEST['x'])));
			if((int)method_exists($this,$func) > 0)
				$this->$func();
			else
				$this->response('',404); // If the method not exist with in this class "Page not found".
		}
		
		private function videos(){ // Get random videos
			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}
            $current_id = $this->_request['current_id'];
            $count = $this->_request['count'];
			$query="SELECT v.id, v.video_id, v.title, v.artist, v.track, v.duration, v.add_date, v.added_by, v.last_played, v.play_count, v.vote_count FROM videos v WHERE v.video_id <> '$current_id' AND v.embeddable = 'true' ORDER BY RAND() LIMIT $count";
			$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);

			if($r->num_rows > 0){
				$result = array();
				while($row = $r->fetch_assoc()){
					$result[] = $row;
				}
				$this->response($this->json($result), 200); // send user details
			}
			$this->response('',204);	// If no records "No Content" status
		}
        private function updateVideo(){
            if($this->get_request_method() != "POST"){
                $this->response('',406);
            }
            $video = json_decode(file_get_contents("php://input"),true);
            $video_id = $video['video_id'];
            $votes = $video['votes'];
            
            $query = "UPDATE videos SET last_played = UTC_TIMESTAMP(), play_count = play_count + 1, vote_count = vote_count + $votes WHERE video_id = '$video_id';";
            $r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
            $success = array('status' => "Success", "msg" => "Video Updated Successfully.", "data" => $video_id);
            $this->response($this->json($success),200);
        }
        private function addVideo(){
            if($this->get_request_method() != "POST"){
                $this->response('',406);
            }
            $video = json_decode(file_get_contents("php://input"),true);
            $added_by = mysqli_real_escape_string($this->mysqli,$video["added_by"]);
            $video_ids = $video["video_ids"];

            $url = "https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatus&id=".$video_ids."&key=".DB::YT_API_KEY;

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_HEADER, 0);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_URL, $url);
            $data = curl_exec($ch);
            curl_close($ch);
            $content = json_decode($data);
            $insert_values = "";
            $array_index = 0;

            foreach ($content->items as $value) {
                $embeddable = $value->status->embeddable ? "true" : "false";
                $title = mysqli_real_escape_string($this->mysqli,$value->snippet->title);
                $duration = $value->contentDetails->duration;
                if(array_key_exists("artist",$video)) {
                    $artist = $video["artist"];
                } else {
                    $exploded = explode(" - ",$title,2);
                    $artist = $exploded[0];
                }
                if(array_key_exists("track",$video)) {
                    $track = $video["track"];
                } else {
                    $exploded = explode(" - ",$title,2);
                    $track = $exploded[1];
                }
                $pre = $array_index == 0 ? "" : ",";
                $insert_values = $insert_values.$pre."('".$value->id."','".$title."','".$artist."','".$track."','".$duration."',UTC_TIMESTAMP(),'".$added_by."','".$embeddable."')";
                $array_index++;
            }
            $query = "INSERT IGNORE INTO videos(video_id,title,artist,track,duration,add_date,added_by,embeddable) VALUES$insert_values;";
            if(!empty($video)){
                $r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
                $success = array('status' => "Success", "msg" => "Video Added Successfully.", "data" => $content);
                $this->response($this->json($success),200);
            }else
                $this->response('',204);	//"No Content" status
        }
        private function pullUncurated(){ // Get uncurated videos
            if($this->get_request_method() != "GET"){
                $this->response('',406);
            }
            $locked = $this->_request['locked'];
            $query="SELECT v.video_id, v.title, v.artist, v.track, v.duration, v.added_by FROM videos v WHERE v.video_id not in ($locked) ORDER BY v.curated_by, v.track, v.artist, v.id LIMIT 5";
            $r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);

            if($r->num_rows > 0){
                $result = array();
                while($row = $r->fetch_assoc()){
                    $result[] = $row;
                }
                $this->response($this->json($result), 200); // send user details
            }
            $this->response('',204);	// If no records "No Content" status
        }
        private function saveCurated(){
            if($this->get_request_method() != "POST"){
                $this->response('',406);
            }
            $curation = json_decode(file_get_contents("php://input"),true);
            $videos = $curation['videos'];
            $username = mysqli_real_escape_string($this->mysqli,$curation['curator']);
            foreach ($videos as $video) {
                $artist = mysqli_real_escape_string($this->mysqli,$video['artist']);
                $track = mysqli_real_escape_string($this->mysqli,$video['track']);
                $video_id = mysqli_real_escape_string($this->mysqli,$video['video_id']);
                $query = "UPDATE videos SET artist = '$artist', track = '$track', curated_by = '$username' WHERE video_id = '$video_id';";
                $r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
            }
            $success = array('status' => "Success", "msg" => "Videos Updated Successfully!", "data" => $curation);
            $this->response($this->json($success),200);
        }
        private function getVideoCount(){ // Get random videos
            if($this->get_request_method() != "GET"){
                $this->response('',406);
            }
            $query="SELECT count(v.video_id) as vidCount, v.add_date, (select topv.added_by from videos topv where concat(year(topv.add_date),'-',month(topv.add_date),'-',day(topv.add_date)) = concat(year(v.add_date),'-',month(v.add_date),'-',day(v.add_date)) group by topv.added_by order by count(topv.added_by) desc limit 1) as topSubmitter from videos v GROUP BY YEAR(v.add_date), MONTH(v.add_date), DAY(v.add_date) ORDER BY v.add_date";
            $r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);

            if($r->num_rows > 0){
                $result = array();
                while($row = $r->fetch_assoc()){
                    $result[] = $row;
                }
                $this->response($this->json($result), 200); // send user details
            }
            $this->response('',204);	// If no records "No Content" status
        }
		private function deleteVideo(){
			if($this->get_request_method() != "DELETE"){
				$this->response('',406);
			}
			$id = (int)$this->_request['id'];
			if($id > 0){				
				$query="DELETE FROM videos WHERE id = $id";
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "Successfully deleted one record.");
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	// If no records "No Content" status
		}
		
		/*
		 *	Encode array into JSON
		*/
		private function json($data){
			if(is_array($data)){
				return json_encode($data);
			}
		}
	}
	
	// Initiate Library
	
	$api = new API;
	$api->processApi();