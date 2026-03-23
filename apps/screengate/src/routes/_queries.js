
import gql from 'graphql-tag';


export const ADD_EMPLOYEE = gql`
mutation AddEmployee($name: String!, $position: String!,$idn: String!) {
	insert_bio(
		objects: {
			full_name: $name,
			id_number: $idn,
			employees: { data: { position: $position } }
		}
	) {
		affected_rows
	}
}

`;


export const ADD_STUDENT = gql`
mutation AddStudent ($data: [bio_insert_input!]! ) {
	insert_bio(objects: $data){affected_rows}
}
`;

export const ADD_GRADE = gql`
mutation AddGrade($name: String!) {
	insert_grade(
		objects: {
			name: $name
		}
	) {
		affected_rows
	}
}
`;
export const GET_GRADES = gql`
query Grades {
	grade(order_by: { created_at: desc }) {
    name
	id
  }
}
`;

export const DELETE_GRADES = gql`
mutation GradesD {
    delete_student(where: {}) {
    affected_rows
  }
  delete_grade(where: {}) {
    affected_rows
  }
}

  `;

export const ALL_BIO =gql`
query AllBio {
  bio(order_by: {created_at: desc}) {
    id_number
    full_name
    created_at
  }
}
`;

export const DELETE_ALL_BIO =gql`
mutation DELETE {
	delete_employee(where: {}) {
	  affected_rows
	}
	delete_student(where: {}) {
	  affected_rows
	}
	delete_contact(where: {}) {
	  affected_rows
	}
	delete_bio(where: {}) {
	  affected_rows
	}
	delete_grade(where: {}) {
	  affected_rows
	}
  }
  `;


export const NEW_SCANS = gql`
subscription ScanBio {
  scan_bio(limit: 1, order_by: {created_at: desc}) {
    bio {
		id
      full_name
    }
  }
}
`;

export const ALL_SCANS = gql`
subscription ScanBio {
  scan_bio(limit: 10, order_by: {created_at: desc}) {
    bio {
		id_number
      full_name
	  created_at
    }
  }
}
`;


export const ANOMALY = gql`
subscription Anomaly {
	scan_anomaly(limit: 1, order_by: {created_at: desc}) {
	  data
	}
  }
  `;
