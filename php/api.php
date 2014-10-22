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
				
		private function login(){
			if($this->get_request_method() != "POST"){
				$this->response('',406);
			}
			$email = $this->_request['email'];		
			$password = $this->_request['pwd'];
			if(!empty($email) and !empty($password)){
				if(filter_var($email, FILTER_VALIDATE_EMAIL)){
					$query="SELECT uid, name, email FROM users WHERE email = '$email' AND password = '".md5($password)."' LIMIT 1";
					$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);

					if($r->num_rows > 0) {
						$result = $r->fetch_assoc();	
						// If success everything is good send header as "OK" and user details
						$this->response($this->json($result), 200);
					}
					$this->response('', 204);	// If no records "No Content" status
				}
			}
			
			$error = array('status' => "Failed", "msg" => "Invalid Email address or Password");
			$this->response($this->json($error), 400);
		}
		
		private function videos(){ // Get 6 random videos
			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}
			$query="
                SELECT v.id, v.video_id, v.title, v.add_date, v.added_by 
                FROM videos v ORDER BY RAND() LIMIT 6;
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
            $title = $video["title"];
            $added_by = $video["added_by"];
            $query = "INSERT INTO videos(id,video_id,title,add_date,added_by) VALUES(NULL,'".$video_id."','".$title."',NOW(),'".$added_by."')";
            if(!empty($video)){
                $r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
                $success = array('status' => "Success", "msg" => "Video Added Successfully.", "data" => $video);
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
?>