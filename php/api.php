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
		
		private function videos(){ // Get 6 random videos
			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}
            $current_id = json_decode(file_get_contents("php://input"),true);
            $current_id = $current_id["current_id"];
			$query="
                SELECT v.id, v.video_id, v.title, v.artist, v.track, v.duration, v.add_date, v.added_by 
                FROM videos v WHERE v.video_id <> '$current_id' ORDER BY RAND() LIMIT 6;
            ";
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
        private function addVideo(){
            if($this->get_request_method() != "POST"){
                $this->response('',406);
            }
            $video = json_decode(file_get_contents("php://input"),true);
            $video_id = $video["video_id"];
            $content = json_decode(file_get_contents("https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatus&id=".$video_id."&key=".DB::YT_API_KEY));
            $embeddable = $content->items[0]->status->embeddable; // Do not add this video if it's not embeddable
            $title = mysql_real_escape_string($content->items[0]->snippet->title);
            $duration = $content->items[0]->contentDetails->duration;
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
            $added_by = mysql_real_escape_string($video["added_by"]);
            $query = "INSERT INTO videos(id,video_id,title,artist,track,duration,add_date,added_by)
                  VALUES(NULL,'$video_id', '$title', '$artist', '$track', '$duration', NOW(), '$added_by')";
            if(!empty($video)){
                $r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
                $success = array('status' => "Success", "msg" => "Video Added Successfully.", "data" => $content);
                $this->response($this->json($success),200);
            }else
                $this->response('',204);	//"No Content" status
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